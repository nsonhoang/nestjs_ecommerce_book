import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionRequestDto } from './dto/promotion.request.dto';
import { PromotionResponseDto } from './dto/promotion.response';
import { PromotionUpdateRequestDto } from './dto/promotion-update.request.dto';
import { PaginatePromotionDto } from './dto/pagination-promotion.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { buildMeta, getPagination } from 'src/utils/pagination.util';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class PromotionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(promotionData: PromotionRequestDto) {
    const newPromotion = await this.prismaService.promotion.create({
      data: {
        name: promotionData.name,
        discountRate: promotionData.discountRate,
        startDate: new Date(promotionData.startDate),
        endDate: new Date(promotionData.endDate),
        books: {
          create: promotionData.bookIds.map((bookId) => ({
            bookId: bookId, // Chỉ cần truyền bookId vào bảng trung gian
          })),
        },
      },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });
    return newPromotion;
  }

  async findAll(
    query: PaginatePromotionDto,
  ): Promise<PaginatedResult<PromotionResponseDto>> {
    try {
      const {
        page,
        limit,
        keyword,
        sortBy,
        sortOrder,
        isActive,
        now,
        startDate,
        endDate,
      } = query;

      const {
        page: safePage,
        limit: safeLimit,
        skip,
        take,
      } = getPagination(page, limit);

      // Khởi tạo đối tượng điều kiện lọc
      const where: Prisma.PromotionWhereInput = {};

      // 1. Tìm kiếm theo tên chương trình
      if (keyword) {
        where.name = { contains: keyword };
      }

      // 2. Logic Trạng thái hoạt động (Quan trọng nhất)

      if (isActive !== undefined) {
        if (isActive === true) {
          where.isActive = true; // Chỉ lấy những chương trình được đánh dấu là active
        } else {
          // Không hoạt động: Hoặc là chưa tới ngày
          where.isActive = false; // Chỉ lấy những chương trình được đánh dấu là inactive
        }
      }
      const referenceTime = new Date(); // Nếu Admin chọn "now", dùng thời gian hiện tại, ngược lại cũng dùng thời gian hiện tại để filter
      if (now) {
        where.startDate = { lte: referenceTime };
        where.endDate = { gte: referenceTime };
      }

      // 3. Lọc theo khoảng thời gian cụ thể (Nếu Admin chọn từ lịch)
      if (startDate || endDate) {
        where.AND = [
          ...(startDate ? [{ startDate: { gte: startDate } }] : []),
          ...(endDate ? [{ endDate: { lte: endDate } }] : []),
        ];
      }

      // 4. Sắp xếp an toàn
      const allowedSortFields = ['name', 'startDate', 'endDate'] as const;
      const safeSortBy = allowedSortFields.includes(sortBy as any)
        ? sortBy
        : 'startDate'; // Mặc định sắp xếp theo ngày bắt đầu nếu sortBy không hợp lệ
      const orderBy = { [safeSortBy]: sortOrder || 'desc' };

      // 5. CHẠY SONG SONG THỰC THỤ (Xóa await bên trong mảng)
      // Việc này giúp giảm 50% thời gian chờ đợi vì DB xử lý đồng thời 2 lệnh
      const [data, total] = await Promise.all([
        this.prismaService.promotion.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            // Vẫn include để lấy ID sách và số lượng sách được áp dụng
            books: { select: { bookId: true } },
            _count: { select: { books: true } },
          },
        }),
        this.prismaService.promotion.count({ where }),
      ]);

      return {
        data: data.map((promotion) => ({
          id: promotion.id,
          name: promotion.name,
          discountRate: promotion.discountRate,
          isActive: promotion.isActive,
          startDate: promotion.startDate,
          endDate: promotion.endDate,
          bookIds: promotion.books.map((b) => b.bookId),
          bookCount: promotion._count.books,
        })),
        meta: buildMeta(safePage, safeLimit, total),
      };
    } catch (error) {
      console.error('Error in findAll promotions:', error);
      throw new Error('Failed to retrieve promotions');
    }
  }

  async findById(id: string): Promise<PromotionResponseDto | null> {
    const promotion = await this.prismaService.promotion.findUnique({
      where: { id },
      include: {
        books: {
          select: {
            bookId: true,
          },
        },
        _count: {
          select: { books: true },
        },
      },
    });
    return promotion;
  }

  //hàm này có thể bỏ nếu filter
  async findPromotionsActive(now: Date): Promise<PromotionResponseDto[]> {
    const promotions = await this.prismaService.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });
    return promotions;
  }

  async update(
    id: string,
    promotionData: PromotionUpdateRequestDto,
  ): Promise<PromotionResponseDto> {
    const { bookIds, ...updateData } = promotionData;
    const updatedPromotion = await this.prismaService.promotion.update({
      where: { id },
      data: {
        ...updateData,
        // Nếu có bookIds trong promotionData, cập nhật mối quan hệ với sách
        books: bookIds
          ? {
              // Xóa các liên kết cũ
              deleteMany: {},
              // Tạo các liên kết mới
              create: bookIds.map((bookId) => ({
                bookId: bookId,
              })),
            }
          : undefined, // Nếu không có bookIds, giữ nguyên mối quan hệ hiện tại
      },
      include: {
        books: {
          select: {
            bookId: true,
          },
        },
        _count: {
          select: { books: true },
        },
      },
    });
    return updatedPromotion;
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.$transaction(async (prisma) => {
      await prisma.bookPromotion.deleteMany({
        where: { promotionId: id },
      });
      await prisma.promotion.delete({
        where: { id },
      });
    });
  }
}
