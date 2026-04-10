import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BookRequestDto } from './dto/book.request.dto';
import { BookResponseDto } from './dto/book.response.dto';

@Injectable()
export class BookRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBooks(): Promise<BookResponseDto[]> {
    const books = await this.prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
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

    return this.prisma.$transaction(async (prisma) => {
      const book = await prisma.book.create({
        data: {
          title: data.title,
          description: data.description,
          price: data.price,
          thumbnail: data.thumbnail,
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
        // include: {
        //   category: {
        //     include: {
        //       category: true,
        //     },
        //   },
        //   authors: {
        //     include: {
        //       author: true,
        //     },
        //   },
        // },
      });
      return {
        ...book,
        price: book.price.toString(),
      };
    });
  }

  async updateBook(id: string, data: BookRequestDto): Promise<BookResponseDto> {
    const categoryIds = data.categoryId ?? [];
    const authorIds = data.authorId ?? [];

    return this.prisma.$transaction(async (prisma) => {
      const bookUpdate = await prisma.book.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          price: data.price,
          thumbnail: data.thumbnail,
          categories: {
            deleteMany: { bookId: id },
            create: categoryIds.map((categoryId) => ({
              category: { connect: { id: categoryId } },
            })),
          },
          authors: {
            deleteMany: { bookId: id },
            create: authorIds.map((authorId) => ({
              author: { connect: { id: authorId } },
            })),
          },
        },
      });
      return {
        ...bookUpdate,
        price: bookUpdate.price.toString(),
      };
    });
  }

  async deleteBook(id: string) {
    return this.prisma.book.delete({
      where: { id },
    });
  }
}
