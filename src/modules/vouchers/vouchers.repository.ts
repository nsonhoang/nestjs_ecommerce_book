import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { buildMeta, getPagination } from 'src/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { PaginateVouchersDto } from 'src/modules/vouchers/dto/pagination-vouchers.dto';
import { VouchersRequestDto } from 'src/modules/vouchers/dto/vouchers.request.dto';
import { VouchersResponseDto } from 'src/modules/vouchers/dto/vouchers.response.dto';
import { VouchersUpdateRequestDto } from 'src/modules/vouchers/dto/vouchers-update.request.dto';

type CreateVoucherInput = Omit<VouchersRequestDto, 'startDate' | 'endDate'> & {
  startDate: Date;
  endDate: Date;
};

type UpdateVoucherInput = Omit<
  VouchersUpdateRequestDto,
  'startDate' | 'endDate'
> & {
  startDate?: Date;
  endDate?: Date;
};

@Injectable()
export class VouchersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(input: CreateVoucherInput): Promise<VouchersResponseDto> {
    return this.prismaService.voucher.create({
      data: {
        code: input.code,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxDiscount: input.maxDiscount,
        minOrderValue: input.minOrderValue ?? 0,
        usageLimit: input.usageLimit ?? 1,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive ?? true,
      },
    });
  }

  async findAll(
    query: PaginateVouchersDto,
  ): Promise<PaginatedResult<VouchersResponseDto>> {
    const { page, limit, keyword, sortBy, sortOrder, isActive, now } = query;
    const {
      page: safePage,
      limit: safeLimit,
      skip,
      take,
    } = getPagination(page, limit);

    const where: Prisma.VoucherWhereInput = {};
    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const referenceTime = new Date();
    if (now) {
      where.startDate = { lte: referenceTime };
      where.endDate = { gte: referenceTime };
      where.isActive = true;
    }

    const allowedSortFields = [
      'createdAt',
      'code',
      'startDate',
      'endDate',
      'usedCount',
    ] as const;

    type SortField = (typeof allowedSortFields)[number];

    const isSortField = (value: string): value is SortField =>
      (allowedSortFields as readonly string[]).includes(value);

    const safeSortBy: SortField = isSortField(sortBy) ? sortBy : 'createdAt';
    const orderBy = { [safeSortBy]: sortOrder || 'desc' } as Record<
      string,
      'asc' | 'desc'
    >;

    const [data, total] = await Promise.all([
      this.prismaService.voucher.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prismaService.voucher.count({ where }),
    ]);

    return {
      data,
      meta: buildMeta(safePage, safeLimit, total),
    };
  }

  findById(id: string): Promise<VouchersResponseDto | null> {
    return this.prismaService.voucher.findUnique({
      where: { id },
    });
  }

  findByCode(code: string): Promise<VouchersResponseDto | null> {
    return this.prismaService.voucher.findUnique({
      where: { code },
    });
  }

  findByCodeTx(
    tx: Prisma.TransactionClient,
    code: string,
  ): Promise<VouchersResponseDto | null> {
    return tx.voucher.findUnique({
      where: { code },
    });
  }

  async hasUserUsedVoucherTx(
    tx: Prisma.TransactionClient,
    input: { userId: string; voucherId: string },
  ): Promise<boolean> {
    const existing = await tx.order.findFirst({
      where: { userId: input.userId, voucherId: input.voucherId },
      select: { id: true },
    });

    return Boolean(existing);
  }

  update(id: string, input: UpdateVoucherInput): Promise<VouchersResponseDto> {
    return this.prismaService.voucher.update({
      where: { id },
      data: {
        // code: input.code,
        description: input.description,
        // discountType: input.discountType,
        // discountValue: input.discountValue,
        // maxDiscount: input.maxDiscount,
        // minOrderValue: input.minOrderValue,
        usageLimit: input.usageLimit,
        // usedCount: input.usedCount,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.voucher.delete({
      where: { id },
    });
  }

  async incrementUsedCount(id: string): Promise<VouchersResponseDto> {
    return this.prismaService.voucher.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });
  }

  async incrementUsedCountTxIfAvailable(
    tx: Prisma.TransactionClient,
    voucherId: string,
    now: Date,
    orderAmount: number,
    expectedUsedCount: number,
  ): Promise<boolean> {
    const result = await tx.voucher.updateMany({
      where: {
        id: voucherId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        minOrderValue: { lte: orderAmount },
        usedCount: expectedUsedCount,
        usageLimit: { gt: expectedUsedCount },
      },
      data: { usedCount: { increment: 1 } },
    });

    return result.count > 0;
  }
}
