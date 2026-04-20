import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BookRequestDto } from './dto/book.request.dto';
import {
  BookDetailResponseDto,
  BookResponseDto,
} from './dto/book.response.dto';
import { BookUpdateRequestDto } from './dto/book-update.request.dto';

import { buildMeta, getPagination } from 'src/utils/pagination.util';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { Prisma } from 'generated/prisma/client';
import { PaginateBookDto } from './dto/paginate-book.dto';

@Injectable()
export class BookRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBooks(
    query: PaginateBookDto,
  ): Promise<PaginatedResult<BookDetailResponseDto>> {
    try {
      const currentDate = new Date();
      const { page, limit, keyword, sortBy, sortOrder } = query;
      const {
        page: safePage,
        limit: safeLimit,
        skip,
        take,
      } = getPagination(page, limit);

      const andConditions: Prisma.BookWhereInput[] = [];

      if (keyword) {
        andConditions.push({
          OR: [
            { title: { contains: keyword } },
            {
              authors: {
                some: {
                  author: {
                    name: { contains: keyword },
                  },
                },
              },
            },
          ],
        });
      }

      if (query.categoryId) {
        andConditions.push({
          categories: {
            some: {
              categoryId: query.categoryId,
            },
          },
        });
      }

      if (query.authorId) {
        // Lọc sách theo authorId
        andConditions.push({
          authors: {
            some: {
              authorId: query.authorId,
            },
          },
        });
      }

      if (query.promotionId) {
        // Lọc sách đang có khuyến mãi theo promotionId
        andConditions.push({
          promotions: {
            some: {
              promotionId: query.promotionId,
            },
          },
        });
      }

      const matching: Prisma.BookWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

      const allowedSortBy = [
        'createdAt',
        'updatedAt',
        'title',
        'price',
      ] as const;
      const safeSortBy = allowedSortBy.includes(
        sortBy as (typeof allowedSortBy)[number],
      )
        ? sortBy
        : 'createdAt';

      const orderBy = {
        [safeSortBy]: sortOrder,
      } as Record<string, 'asc' | 'desc'>;

      const [data, total] = await Promise.all([
        this.prisma.book.findMany({
          where: matching,
          skip,
          take,
          orderBy,
          include: {
            images: true,
            categories: { include: { category: true } },
            authors: { include: { author: true } },
            promotions: {
              where: {
                promotion: {
                  isActive: true,
                  startDate: { lte: currentDate },
                  endDate: { gte: currentDate },
                },
              },
              include: { promotion: true },
            },
          },
        }),
        this.prisma.book.count({ where: matching }),
      ]);

      return {
        data: data.map((b) => ({
          ...b,
          categories: b.categories.map((bc) => bc.category),
          authors: b.authors.map((item) => item.author),
          promotions: b.promotions.map((bp) => ({
            id: bp.promotion.id,
            name: bp.promotion.name,
            discountRate: bp.promotion.discountRate,
            isActive: bp.promotion.isActive,
            startDate: bp.promotion.startDate,
            endDate: bp.promotion.endDate,
          })),
          images: b.images,
          price: b.price,
        })),
        meta: buildMeta(safePage, safeLimit, total),
      };
    } catch (error) {
      console.error('Error fetching books:', error);
      throw new Error('Không thể lấy danh sách sách');
    }
  }

  async getBookById(id: string): Promise<BookDetailResponseDto | null> {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        images: true,
        categories: { include: { category: true } },
        authors: { include: { author: true } },
        promotions: {
          where: {
            promotion: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
            },
          },
          include: { promotion: true },
        },
      },
    });

    if (!book) return null;

    return {
      ...book,
      categories: book.categories.map((bc) => bc.category),
      authors: book.authors.map((item) => item.author),
      promotions: book.promotions.map((bp) => ({
        id: bp.promotion.id,
        name: bp.promotion.name,
        discountRate: bp.promotion.discountRate,
        isActive: bp.promotion.isActive,

        startDate: bp.promotion.startDate,
        endDate: bp.promotion.endDate,
      })),
      images: book.images,
      price: book.price, // Decimal -> string
    };
  }

  async createBook(data: BookRequestDto): Promise<BookResponseDto> {
    const categoryIds = data.categoryId ?? [];
    const authorIds = data.authorId ?? [];

    const book = await this.prisma.book.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        thumbnail: data.thumbnail ?? ' example.jpg',
        categories: categoryIds.length
          ? {
              create: categoryIds.map((id) => ({
                category: { connect: { id } },
              })),
            }
          : undefined,
        authors: authorIds.length
          ? {
              create: authorIds.map((id) => ({
                author: { connect: { id } },
              })),
            }
          : undefined,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        authors: {
          include: {
            author: true,
          },
        },
        images: true,
      },
    });

    return {
      ...book,
      price: book.price,
      authors: book.authors.map((item) => ({
        id: item.author.id,
        name: item.author.name,
        dateOfBirth: item.author.dateOfBirth,
        info: item.author.info,
        nationality: item.author.nationality,
      })),
      categories: book.categories.map((item) => ({
        id: item.category.id,
        name: item.category.name,
      })),
      images: book.images,
    };
  }

  async updateBook(
    id: string,
    data: BookUpdateRequestDto,
  ): Promise<BookResponseDto> {
    // 1. Tạo object chứa các thông tin cơ bản cập nhật
    const updateData: Prisma.BookUpdateInput = {
      title: data.title,
      description: data.description,
      price: data.price,
      thumbnail: data.thumbnail,
    };

    // 2. CHỈ cập nhật Danh mục NẾU Frontend thực sự có gửi trường này
    if (data.categoryId !== undefined) {
      updateData.categories = {
        deleteMany: { bookId: id }, // Xóa hết liên kết cũ
        create: data.categoryId.map((categoryId) => ({
          category: { connect: { id: categoryId } },
        })), // Tạo lại liên kết mới (Nếu mảng rỗng thì nó chỉ xóa mà không tạo)
      };
    }

    // 3. CHỈ cập nhật Tác giả NẾU Frontend thực sự có gửi trường này
    if (data.authorId !== undefined) {
      updateData.authors = {
        deleteMany: { bookId: id },
        create: data.authorId.map((authorId) => ({
          author: { connect: { id: authorId } },
        })),
      };
    }

    // 4. Gọi 1 lệnh update duy nhất (Prisma tự handle Transaction)
    const bookUpdate = await this.prisma.book.update({
      where: { id },
      data: updateData,
      include: {
        categories: { include: { category: true } },
        authors: { include: { author: true } },
        images: true,
      },
    });

    // 5. Mapping dữ liệu trả về
    return {
      ...bookUpdate,
      price: bookUpdate.price,
      authors: bookUpdate.authors.map((item) => ({
        id: item.author.id,
        name: item.author.name,
        dateOfBirth: item.author.dateOfBirth,
        info: item.author.info,
        nationality: item.author.nationality,
      })),
      categories: bookUpdate.categories.map((item) => ({
        id: item.category.id,
        name: item.category.name,
      })),
      images: bookUpdate.images,
    };
  }

  async deleteBook(id: string) {
    //kiểm tra xóa bảng trung gian trước
    return this.prisma.$transaction(async (prisma) => {
      await prisma.bookCategory.deleteMany({
        where: { bookId: id },
      });
      await prisma.bookAuthor.deleteMany({
        where: { bookId: id },
      });
      await prisma.book.delete({
        where: { id },
      });
      // await prisma.bookImage.deleteMany({ // Xóa trên service rồi
      //   where: { bookId: id },
      // });
      await prisma.bookPromotion.deleteMany({
        where: { bookId: id },
      });
    });
  }

  async getBooksByAuthorId(authorId: string): Promise<BookResponseDto[]> {
    //có filter rồi nên kh cần cái này nữa, nhưng tạm thời giữ lại để test
    const books = await this.prisma.book.findMany({
      where: {
        authors: {
          some: {
            authorId,
          },
        },
      },
      include: {
        images: true,
        categories: { include: { category: true } },
        authors: { include: { author: true } },
      },
    });

    return books.map((b) => ({
      ...b,
      categories: b.categories.map((bc) => bc.category),
      authors: b.authors.map((item) => item.author),
      price: b.price, // Decimal -> string
      images: b.images,
    }));
  }
  async getBooksByCategoryId(categoryId: string): Promise<BookResponseDto[]> {
    //có filter rồi nên kh cần cái này nữa, nhưng tạm thời giữ lại để test
    const books = await this.prisma.book.findMany({
      where: {
        categories: {
          some: {
            categoryId,
          },
        },
      },
      include: {
        images: true,
        categories: { include: { category: true } },
        authors: { include: { author: true } },
      },
    });

    return books.map((b) => ({
      ...b,
      categories: b.categories.map((bc) => bc.category),
      authors: b.authors.map((item) => item.author),
      price: b.price, // Decimal -> string
    }));
  }
}
