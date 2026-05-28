import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UpdateInventoryDto } from './dto/update-inventory.request.dto';
import { InventoryRepository } from './inventory.repository';
import {
  InventoryLogCommand,
  InventoryLogRequestDto,
  InventoryRequestDto,
} from './dto/inventory.request.dto';
import {
  InventoryLogResponseDto,
  InventoryResponseDto,
} from './dto/inventory.response.dto';
import PaginateInventoryLogsDto from './dto/paginate-inventory-logs.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { InventoryLogType } from 'generated/prisma/enums';
import { JwtUser } from 'src/strategies/jwt-payload.interface';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async getAllLog(
    query: PaginateInventoryLogsDto,
  ): Promise<PaginatedResult<InventoryLogResponseDto>> {
    try {
      const { page = 1, limit = 10, inventoryId, type, from, to } = query;
      return await this.inventoryRepository.getAllLog(
        Number(page),
        Number(limit),
        inventoryId,
        type,
        from,
        to,
      );
    } catch (error) {
      this.logger.error('Lỗi khi lấy log kho', error);
      throw new InternalServerErrorException('Lỗi khi lấy log kho');
    }
  }

  async decrementStockByTx(
    tx: Prisma.TransactionClient,
    bookId: string,
    quantity: number,
  ): Promise<number> {
    return await this.inventoryRepository.decrementStockByTx(
      tx,
      bookId,
      quantity,
    );
  }

  async increaseStockByTx(
    tx: Prisma.TransactionClient,
    bookId: string,
    quantity: number,
  ): Promise<number> {
    return await this.inventoryRepository.increaseStockByTx(
      tx,
      bookId,
      quantity,
    );
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
    return this.inventoryRepository.createLogByTx(tx, data);
  }

  async decrementStockAndLogByTx(
    tx: Prisma.TransactionClient,
    bookId: string,
    quantity: number,
    createdBy?: string,
    reason?: string,
  ): Promise<number> {
    return this.inventoryRepository.decrementStockAndLogByTx(
      tx,
      bookId,
      quantity,
      createdBy,
      reason,
    );
  }

  async increaseStockAndLogByTx(
    tx: Prisma.TransactionClient,
    bookId: string,
    quantity: number,
    createdBy?: string,
    reason?: string,
  ): Promise<number> {
    return this.inventoryRepository.increaseStockAndLogByTx(
      tx,
      bookId,
      quantity,
      createdBy,
      reason,
    );
  }

  async create(createInventoryDto: InventoryRequestDto) {
    try {
      const inventory =
        await this.inventoryRepository.create(createInventoryDto);
      return inventory;
    } catch (error) {
      this.logger.error('Lỗi khi tạo kho', error);
      throw new InternalServerErrorException('Lỗi khi tạo kho');
    }
  }

  //cái này đang test
  async createInventoryLog(
    inventoryLogDto: InventoryLogRequestDto,
    reqPayload: JwtUser,
  ): Promise<InventoryLogResponseDto> {
    if (!reqPayload?.userId) {
      throw new UnauthorizedException('Không xác định được người thao tác');
    }

    const command: InventoryLogCommand = {
      ...inventoryLogDto,
      userId: reqPayload.userId,
    };

    if (command.type === InventoryLogType.IN) {
      if (command.change <= 0) {
        throw new BadRequestException('Số lượng nhập kho phải là số dương');
      }
      return this.inventoryRepository.increaseStock(command);
    }

    if (command.type === InventoryLogType.OUT) {
      if (command.change <= 0) {
        throw new BadRequestException('Số lượng xuất kho phải là số dương');
      }
      return this.inventoryRepository.decreaseStock(command);
    }

    if (command.change === 0) {
      throw new BadRequestException('Số lượng điều chỉnh không được bằng 0');
    }

    return this.inventoryRepository.adjustStock(command);
  }

  findAll(): Promise<InventoryResponseDto[]> {
    return this.inventoryRepository.findAll();
  }

  async findOne(id: string) {
    try {
      const inventory = await this.inventoryRepository.findById(id);

      if (!inventory) {
        this.logger.warn(`Inventory with id ${id} not found`);
        throw new NotFoundException('Kho không tồn tại');
      }

      return inventory;
    } catch (error) {
      this.logger.error('Lỗi khi tìm kiếm kho', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi tìm kiếm kho');
    }
  }

  async findByBookId(bookId: string): Promise<InventoryResponseDto | null> {
    try {
      return await this.inventoryRepository.findByBookId(bookId);
    } catch (error) {
      this.logger.error('Lỗi khi tìm kiếm kho theo bookId', error);
      throw new InternalServerErrorException('Lỗi khi tìm kiếm kho');
    }
  }
  async findByBookIds(bookIds: string[]): Promise<InventoryResponseDto[]> {
    try {
      return await this.inventoryRepository.findByBookIds(bookIds);
    } catch (error) {
      this.logger.error('Lỗi khi tìm kiếm kho theo bookIds', error);
      throw new InternalServerErrorException('Lỗi khi tìm kiếm kho');
    }
  }

  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    try {
      const inventory = await this.inventoryRepository.update(
        id,
        updateInventoryDto,
      );
      return inventory;
    } catch (error) {
      this.logger.error('Lỗi khi cập nhật kho', error);
      throw new InternalServerErrorException('Lỗi khi cập nhật kho');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.inventoryRepository.delete(id);
    } catch (error) {
      this.logger.error('Lỗi khi xóa kho', error);
      throw new InternalServerErrorException('Lỗi khi xóa kho');
    }
  }
}
