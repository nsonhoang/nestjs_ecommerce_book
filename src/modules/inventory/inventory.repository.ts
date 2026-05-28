import { Injectable } from '@nestjs/common';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { getPagination, buildMeta } from 'src/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  InventoryLogCommand,
  InventoryRequestDto,
} from './dto/inventory.request.dto';
import { UpdateInventoryDto } from './dto/update-inventory.request.dto';
import {
  InventoryLogResponseDto,
  InventoryResponseDto,
} from './dto/inventory.response.dto';
import { InventoryLogType, Prisma } from 'generated/prisma/client';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllLog(
    page = 1,
    limit = 10,
    inventoryId?: string,
    type?: InventoryLogType,
    from?: string,
    to?: string,
  ): Promise<PaginatedResult<InventoryLogResponseDto>> {
    const {
      page: safePage,
      limit: safeLimit,
      skip,
      take,
    } = getPagination(page, limit);

    const andConditions: Prisma.InventoryLogWhereInput[] = [];

    if (inventoryId) {
      andConditions.push({ inventoryId });
    }

    if (type) {
      andConditions.push({ type });
    }

    if (from || to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      andConditions.push({ createdAt: dateFilter });
    }

    const where: Prisma.InventoryLogWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [data, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          inventoryId: true,
          change: true,
          beforeQty: true,
          afterQty: true,
          reason: true,
          type: true,
          createdAt: true,
        },
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    return {
      data,
      meta: buildMeta(safePage, safeLimit, total),
    };
  }

  async decrementStockByTx(
    tx: Prisma.TransactionClient,
    bookId: string,
    quantity: number,
  ): Promise<number> {
    const updateStock = await tx.inventory.updateMany({
      where: {
        bookId: bookId,
        quantity: { gte: quantity },
      },
      data: { quantity: { decrement: quantity } },
    });
    return updateStock.count;
  }

  async increaseStockByTx(
    tx: Prisma.TransactionClient,
    bookId: string,
    quantity: number,
  ): Promise<number> {
    const updateStock = await tx.inventory.updateMany({
      where: {
        bookId: bookId,
      },
      data: { quantity: { increment: quantity } },
    });
    return updateStock.count;
  }

  async decrementStockAndLogByTx(
    tx: Prisma.TransactionClient,
    bookId: string,
    quantity: number,
    createdBy?: string,
    reason = 'Xuất kho khi tạo đơn hàng',
  ): Promise<number> {
    const inventory = await tx.inventory.findUnique({
      where: { bookId },
      select: { id: true, quantity: true },
    });

    if (!inventory || inventory.quantity < quantity) {
      return 0;
    }

    const afterQty = inventory.quantity - quantity;

    await tx.inventory.update({
      where: { bookId },
      data: { quantity: afterQty },
    });

    await tx.inventoryLog.create({
      data: {
        inventoryId: inventory.id,
        change: -quantity,
        beforeQty: inventory.quantity,
        afterQty,
        type: InventoryLogType.OUT,
        reason,
        createdBy,
      },
    });

    return 1;
  }

  async increaseStockAndLogByTx(
    tx: Prisma.TransactionClient,
    bookId: string,
    quantity: number,
    createdBy?: string,
    reason = 'Nhập kho khi hoàn hàng/hủy đơn',
  ): Promise<number> {
    const inventory = await tx.inventory.findUnique({
      where: { bookId },
      select: { id: true, quantity: true },
    });

    if (!inventory) {
      return 0;
    }

    const afterQty = inventory.quantity + quantity;

    await tx.inventory.update({
      where: { bookId },
      data: { quantity: afterQty },
    });

    await tx.inventoryLog.create({
      data: {
        inventoryId: inventory.id,
        change: quantity,
        beforeQty: inventory.quantity,
        afterQty,
        type: InventoryLogType.IN,
        reason,
        createdBy,
      },
    });

    return 1;
  }

  async createLogByTx(
    tx: Prisma.TransactionClient,
    data: {
      inventoryId: string;
      change: number;
      beforeQty: number;
      afterQty: number;
      type: InventoryLogType;
      reason?: string;
      createdBy?: string;
    },
  ) {
    return tx.inventoryLog.create({
      data,
    });
  }

  async create(request: InventoryRequestDto): Promise<InventoryResponseDto> {
    //mặc dịnh quantity là 0 khi thêm sản phẩm vòa kho và phải có thêm bước nhập kho để cập nhật số lượng sau
    return this.prisma.inventory.create({
      data: {
        bookId: request.bookId,
        quantity: 0,
      },
      select: {
        id: true,
        book: {
          select: { id: true, title: true, thumbnail: true, price: true },
        },
        quantity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Xóa toàn bộ Log liên quan trước
      await tx.inventoryLog.deleteMany({
        where: { inventoryId: id },
      });

      // 2. Sau đó mới xóa Inventory an toàn
      return tx.inventory.delete({
        where: { id },
      });
    });
  }

  async findById(id: string): Promise<InventoryResponseDto | null> {
    return this.prisma.inventory.findUnique({
      where: { id },
      select: {
        id: true,
        book: {
          select: { id: true, title: true, thumbnail: true, price: true },
        },
        quantity: true,
        createdAt: true,
        updatedAt: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            inventoryId: true,
            change: true,
            beforeQty: true,
            afterQty: true,
            reason: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });
  }

  findAll(): Promise<InventoryResponseDto[]> {
    // có thể pagination và limit nếu cần
    return this.prisma.inventory.findMany({
      select: {
        id: true,
        book: {
          select: { id: true, title: true, thumbnail: true, price: true },
        },
        quantity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByBookId(bookId: string): Promise<InventoryResponseDto | null> {
    return this.prisma.inventory.findFirst({
      where: { bookId },
      select: {
        id: true,
        book: {
          select: { id: true, title: true, thumbnail: true, price: true },
        },
        quantity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByBookIds(bookIds: string[]): Promise<InventoryResponseDto[]> {
    return this.prisma.inventory.findMany({
      where: { bookId: { in: bookIds } },
      select: {
        id: true,
        book: {
          select: { id: true, title: true, thumbnail: true, price: true },
        },
        quantity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    return this.prisma.inventory.update({
      where: { id },
      data,
      select: {
        id: true,
        book: {
          select: { id: true, title: true, thumbnail: true, price: true },
        },
        quantity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  //tạo hàm cập nhật số lượng nhập kho

  // async createLogInventory(request: InventoryLogRequestDto) {
  //   return this.prisma.inventoryLog.create({
  //     data: {
  //       inventoryId: request.inventoryId,
  //       change: request.change,
  //       afterQty: 0, // Cần tính toán số lượng sau khi thay đổi
  //       beforeQty: 0, // Cần tính toán số lượng trước khi thay đổi
  //       reason: request.reason,
  //       type: request.type,
  //     },
  //   });
  // }

  // hàm nhập kho
  async increaseStock(
    request: InventoryLogCommand,
  ): Promise<InventoryLogResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      const inventory = await prisma.inventory.findUniqueOrThrow({
        where: { id: request.inventoryId },
      });
      const beforeQty = inventory.quantity;
      const afterQty = beforeQty + request.change;

      await prisma.inventory.update({
        where: { id: request.inventoryId },
        data: { quantity: afterQty },
      });

      return await prisma.inventoryLog.create({
        data: {
          inventoryId: request.inventoryId,
          change: request.change,
          beforeQty: beforeQty,
          afterQty: afterQty,
          createdBy: request.userId,
          reason: request.reason ?? ' Nhập kho',
          type: request.type,
        },
      });
    });
  }

  // hàm xuất kho
  async decreaseStock(
    request: InventoryLogCommand,
  ): Promise<InventoryLogResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      const inventory = await prisma.inventory.findUniqueOrThrow({
        where: { id: request.inventoryId },
      });
      const beforeQty = inventory.quantity;
      const afterQty = beforeQty - Math.abs(request.change); // Đảm bảo số lượng giảm là số dương

      if (afterQty < 0) {
        throw new Error('Số lượng kho không đủ để xuất');
      }

      await prisma.inventory.update({
        where: { id: request.inventoryId },
        data: { quantity: afterQty },
      });

      return await prisma.inventoryLog.create({
        data: {
          inventoryId: request.inventoryId,
          change: -Math.abs(request.change), // Đảm bảo số lượng giảm là số âm
          beforeQty: beforeQty,
          afterQty: afterQty,
          createdBy: request.userId,
          reason: request.reason ?? ' Xuất kho',
          type: request.type,
        },
      });
    });
  }

  // hàm điều chỉnh kho thủ công

  async adjustStock(
    request: InventoryLogCommand,
  ): Promise<InventoryLogResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      const inventory = await prisma.inventory.findUniqueOrThrow({
        where: { id: request.inventoryId },
      });
      const beforeQty = inventory.quantity;
      const afterQty = beforeQty + request.change; // Có thể tăng hoặc giảm tùy vào change

      if (afterQty < 0) {
        throw new Error('Số lượng kho không được âm');
      }

      await prisma.inventory.update({
        where: { id: request.inventoryId },
        data: { quantity: afterQty },
      });

      return await prisma.inventoryLog.create({
        data: {
          inventoryId: request.inventoryId,
          change: request.change, // Có thể là số dương hoặc âm
          beforeQty: beforeQty,
          afterQty: afterQty,
          createdBy: request.userId,
          reason: request.reason ?? 'Điều chỉnh kho',
          type: request.type,
        },
      });
    });
  }
}
