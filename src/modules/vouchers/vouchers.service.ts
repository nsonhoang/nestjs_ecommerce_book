import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from 'generated/prisma/client';
import { DiscountType } from 'src/modules/vouchers/dto/vouchers.request.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { PaginateVouchersDto } from 'src/modules/vouchers/dto/pagination-vouchers.dto';
import { VouchersRequestDto } from 'src/modules/vouchers/dto/vouchers.request.dto';
import { VouchersResponseDto } from 'src/modules/vouchers/dto/vouchers.response.dto';
import { VouchersUpdateRequestDto } from 'src/modules/vouchers/dto/vouchers-update.request.dto';
import { VouchersRepository } from './vouchers.repository';

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(private readonly vouchersRepository: VouchersRepository) {}

  async createVoucher(data: VouchersRequestDto): Promise<VouchersResponseDto> {
    const normalizedCode = this.normalizeCode(data.code);
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    this.validateDateRange(startDate, endDate);
    this.validateDiscountRule(
      data.discountType,
      data.discountValue,
      data.maxDiscount,
    );

    const existing = await this.vouchersRepository.findByCode(normalizedCode);
    if (existing) {
      throw new BadRequestException('Voucher code đã tồn tại');
    }

    return this.vouchersRepository.create({
      ...data,
      code: normalizedCode,
      startDate,
      endDate,
    });
  }

  getVouchers(
    query: PaginateVouchersDto,
  ): Promise<PaginatedResult<VouchersResponseDto>> {
    return this.vouchersRepository.findAll(query);
  }

  async getVoucherById(id: string): Promise<VouchersResponseDto> {
    const voucher = await this.vouchersRepository.findById(id);
    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher');
    }
    return voucher;
  }

  async updateVoucher(
    id: string,
    data: VouchersUpdateRequestDto,
  ): Promise<VouchersResponseDto> {
    const existing = await this.vouchersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    // const nextCode = data.code ? this.normalizeCode(data.code) : existing.code;
    // if (data.code && nextCode !== existing.code) {
    //   const duplicated = await this.vouchersRepository.findByCode(nextCode);
    //   if (duplicated) {
    //     throw new BadRequestException('Voucher code đã tồn tại');
    //   }
    // }

    if (data.usageLimit !== undefined && data.usageLimit < existing.usedCount) {
      throw new BadRequestException(
        'usageLimit không được nhỏ hơn usedCount hiện tại',
      );
    }

    const nextStartDate = data.startDate
      ? new Date(data.startDate)
      : existing.startDate;
    const nextEndDate = data.endDate
      ? new Date(data.endDate)
      : existing.endDate;
    this.validateDateRange(nextStartDate, nextEndDate);

    // const nextDiscountType = data.discountType ?? existing.discountType;
    // const nextDiscountValue = data.discountValue ?? existing.discountValue;
    // const nextMaxDiscount =
    //   data.maxDiscount ?? existing.maxDiscount ?? undefined;
    // this.validateDiscountRule(
    //   nextDiscountType,
    //   nextDiscountValue,
    //   nextMaxDiscount,
    // );

    // if (
    //   data.usageLimit !== undefined &&
    //   data.usageLimit < (data.usedCount ?? existing.usedCount)
    // ) {
    //   throw new BadRequestException(
    //     'usageLimit không được nhỏ hơn usedCount hiện tại',
    //   );
    // }

    // if (data.usedCount !== undefined && data.usedCount < 0) {
    //   throw new BadRequestException('usedCount không hợp lệ');
    // }

    return this.vouchersRepository.update(id, {
      ...data,
      // code: data.code ? nextCode : undefined,
      startDate: data.startDate ? nextStartDate : undefined,
      endDate: data.endDate ? nextEndDate : undefined,
    });
  }

  async deleteVoucher(id: string): Promise<void> {
    const existing = await this.vouchersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    await this.vouchersRepository.delete(id);
  }

  /**
   * Dùng khi checkout: validate voucher + tăng usedCount trong cùng transaction.
   */
  async applyVoucherForOrder(
    tx: Prisma.TransactionClient,
    input: { code: string; orderAmount: number; userId: string; now?: Date },
  ): Promise<{ voucherId: string; discountAmount: number }> {
    const now = input.now ?? new Date();
    const code = this.normalizeCode(input.code);
    const orderAmount = input.orderAmount;
    const userId = input.userId;

    const voucher = await this.vouchersRepository.findByCodeTx(tx, code);
    if (!voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }

    if (!voucher.isActive) {
      throw new BadRequestException('Voucher đang bị tắt');
    }
    if (voucher.startDate > now || voucher.endDate < now) {
      throw new BadRequestException(
        'Voucher không nằm trong thời gian áp dụng',
      );
    }
    if (orderAmount < voucher.minOrderValue) {
      throw new BadRequestException('Đơn hàng chưa đạt giá trị tối thiểu');
    }
    if (voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException('Voucher đã hết lượt sử dụng');
    }

    const alreadyUsed = await this.vouchersRepository.hasUserUsedVoucherTx(tx, {
      userId,
      voucherId: voucher.id,
    });
    if (alreadyUsed) {
      throw new BadRequestException('Mỗi voucher chỉ được sử dụng 1 lần/user');
    }

    this.validateDiscountRule(
      voucher.discountType,
      Number(voucher.discountValue),
      voucher.maxDiscount,
    );

    const discountAmount = this.calculateDiscount(
      voucher,
      Math.max(0, orderAmount),
    );

    const updated =
      await this.vouchersRepository.incrementUsedCountTxIfAvailable(
        tx,
        voucher.id,
        now,
        orderAmount,
        voucher.usedCount,
      );
    if (!updated) {
      throw new BadRequestException('Voucher đã hết lượt sử dụng');
    }

    return { voucherId: voucher.id, discountAmount };
  }

  /**
   * Hàm nội bộ để module Orders có thể gọi về sau.
   * Không expose ra controller để tránh thêm endpoint ngoài yêu cầu.
   */
  async validateVoucherForOrder(input: {
    code: string;
    orderAmount: number;
    now?: Date;
  }): Promise<{
    voucher: VouchersResponseDto;
    discountAmount: number;
  }> {
    const now = input.now ?? new Date();
    const code = this.normalizeCode(input.code);

    const voucher = await this.vouchersRepository.findByCode(code);
    if (!voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }
    if (!voucher.isActive) {
      throw new BadRequestException('Voucher đang bị tắt');
    }
    if (voucher.startDate > now || voucher.endDate < now) {
      throw new BadRequestException(
        'Voucher không nằm trong thời gian áp dụng',
      );
    }
    if (voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException('Voucher đã hết lượt sử dụng');
    }
    if (input.orderAmount < voucher.minOrderValue) {
      throw new BadRequestException('Đơn hàng chưa đạt giá trị tối thiểu');
    }

    const discountAmount = this.calculateDiscount(voucher, input.orderAmount);
    return { voucher, discountAmount };
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('startDate/endDate không hợp lệ');
    }
    if (endDate <= startDate) {
      throw new BadRequestException('endDate phải sau startDate');
    }
  }

  private validateDiscountRule(
    discountType: DiscountType,
    discountValue: number,
    maxDiscount?: number | null,
  ): void {
    if (discountValue <= 0) {
      throw new BadRequestException('discountValue phải lớn hơn 0');
    }

    if (discountType === 'PERCENTAGE') {
      if (discountValue > 100) {
        throw new BadRequestException('discountValue (PERCENTAGE) tối đa 100');
      }
      if (
        maxDiscount !== undefined &&
        maxDiscount !== null &&
        maxDiscount <= 0
      ) {
        throw new BadRequestException('maxDiscount không hợp lệ');
      }
    }

    if (discountType === 'FIXED_AMOUNT') {
      if (maxDiscount !== undefined && maxDiscount !== null) {
        throw new BadRequestException(
          'Không cần maxDiscount khi discountType là FIXED_AMOUNT',
        );
      }
    }
  }

  private calculateDiscount(voucher: VouchersResponseDto, orderAmount: number) {
    if (orderAmount <= 0) return 0;

    if (voucher.discountType === 'FIXED_AMOUNT') {
      return Math.max(
        0,
        Math.min(orderAmount, Math.floor(voucher.discountValue)),
      );
    }

    const raw = (orderAmount * voucher.discountValue) / 100;
    const capped =
      voucher.maxDiscount !== null && voucher.maxDiscount !== undefined
        ? Math.min(raw, voucher.maxDiscount)
        : raw;

    return Math.max(0, Math.min(orderAmount, Math.floor(capped)));
  }
}
