import { Injectable } from '@nestjs/common';
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

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(request: InventoryRequestDto): Promise<InventoryResponseDto> {
    //mặc dịnh quantity là 0 khi thêm sản phẩm vòa kho và phải có thêm bước nhập kho để cập nhật số lượng sau
    return this.prisma.inventory.create({
      data: {
        bookId: request.bookId,
        quantity: 0,
      },
      select: {
        id: true,
        book: { select: { id: true, title: true, thumbnail: true } },
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
        book: { select: { id: true, title: true, thumbnail: true } },
        quantity: true,
        createdAt: true,
        updatedAt: true,
        logs: {
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
        book: { select: { id: true, title: true, thumbnail: true } },
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
        book: { select: { id: true, title: true, thumbnail: true } },
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
        book: { select: { id: true, title: true, thumbnail: true } },
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
