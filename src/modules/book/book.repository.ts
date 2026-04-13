import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BookRequestDto } from './dto/book.request.dto';
import { BookResponseDto } from './dto/book.response.dto';
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
  ): Promise<PaginatedResult<BookResponseDto>> {
    try {
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
        andConditions.push({
          authors: {
            some: {
              authorId: query.authorId,
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
          },
        }),
        this.prisma.book.count({ where: matching }),
      ]);

      return {
        data: data.map((b) => ({
          ...b,
          categories: b.categories.map((bc) => bc.category),
          authors: b.authors.map((item) => item.author),
          price: b.price.toString(),
        })),
        meta: buildMeta(safePage, safeLimit, total),
      };
    } catch (error) {
      console.error('Error fetching books:', error);
      throw new Error('Không thể lấy danh sách sách');
    }
  }

  async getBookById(id: string): Promise<BookResponseDto | null> {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        images: true,
        categories: { include: { category: true } },
        authors: { include: { author: true } },
      },
    });

    if (!book) return null;

    return {
      ...book,
      categories: book.categories.map((bc) => bc.category),
      authors: book.authors.map((item) => item.author),
      price: book.price.toString(), // Decimal -> string
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
        thumbnail: data.thumbnail ?? '',
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
      },
    });

    return {
      ...book,
      price: book.price.toString(),
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
    };
  }

  async updateBook(
    id: string,
    data: BookUpdateRequestDto,
  ): Promise<BookResponseDto> {
    const categoryIds = data.categoryId ?? [];
    const authorIds = data.authorId ?? [];

    return this.prisma.$transaction(async (prisma) => {
      //để ntn kh thì sẽ ràng buộc dữ liệu sách phải thuộc ít nhất 1 danh mục và có ít nhất 1 tác giả, nếu muốn cho phép sách không thuộc danh mục nào hoặc không có tác giả nào thì chỉ cần bỏ điều kiện kiểm tra mảng categoryIds và authorIds là đc
      if (categoryIds.length > 0) {
        await prisma.bookCategory
          .deleteMany({
            where: { bookId: id },
          })
          .then(() => {
            // Tạo liên kết mới với danh mục
            return prisma.bookCategory.createMany({
              data: categoryIds.map((categoryId) => ({
                bookId: id,
                categoryId,
              })),
            });
          });
      }
      if (authorIds.length > 0) {
        await prisma.bookAuthor
          .deleteMany({
            where: { bookId: id },
          })
          .then(() => {
            // Tạo liên kết mới với tác giả
            return prisma.bookAuthor.createMany({
              data: authorIds.map((authorId) => ({
                bookId: id,
                authorId,
              })),
            });
          });
      }

      const bookUpdate = await prisma.book.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          price: data.price,
          thumbnail: data.thumbnail,
          //để ntn thì nêu update thì khi không truyền categoryId hoặc author thì sẽ mất hết liên kết, khi thì sách sẽ kh có tác giả hoặc danh mục nào
          // categories: {
          //   deleteMany: { bookId: id },
          //   create: categoryIds.map((categoryId) => ({
          //     category: { connect: { id: categoryId } },
          //   })),
          // },
          // authors: {
          //   deleteMany: { bookId: id },
          //   create: authorIds.map((authorId) => ({
          //     author: { connect: { id: authorId } },
          //   })),
          // },
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
        },
      });
      return {
        ...bookUpdate,

        price: bookUpdate.price.toString(),
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
      };
    });
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
    });
  }

  async getBooksByAuthorId(authorId: string): Promise<BookResponseDto[]> {
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
      price: b.price.toString(), // Decimal -> string
    }));
  }
  async getBooksByCategoryId(categoryId: string): Promise<BookResponseDto[]> {
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
      price: b.price.toString(), // Decimal -> string
    }));
  }
}
