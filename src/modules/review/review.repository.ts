import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { buildMeta, getPagination } from 'src/utils/pagination.util';
import { ReviewResponseDto } from './dto/review.response.dto';

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ReviewCreateInput): Promise<ReviewResponseDto> {
    return await this.prisma.review.create({ data });
  }

  async updateById(
    id: string,
    data: Prisma.ReviewUpdateInput,
  ): Promise<ReviewResponseDto> {
    return await this.prisma.review.update({ where: { id }, data });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.review.delete({ where: { id } });
  }

  async findById(id: string): Promise<ReviewResponseDto | null> {
    return await this.prisma.review.findUnique({ where: { id } });
  }

  async findByUserAndBook(
    userId: string,
    bookId: string,
  ): Promise<ReviewResponseDto | null> {
    return await this.prisma.review.findFirst({ where: { userId, bookId } });
  }

  async findByBookId(
    bookId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    const { page, limit, sortBy, sortOrder } = paginationQuery;
    const {
      page: safePage,
      limit: safeLimit,
      skip,
      take,
    } = getPagination(page, limit);

    const allowedSortBy = ['createdAt', 'rating'];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';

    const orderBy = {
      [safeSortBy]: sortOrder,
    } as Record<string, 'asc' | 'desc'>;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { bookId },
        skip,
        take,
        orderBy,
      }),
      this.prisma.review.count({ where: { bookId } }),
    ]);

    return {
      data,
      meta: buildMeta(safePage, safeLimit, total),
    };
  }
}
