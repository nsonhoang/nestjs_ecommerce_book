import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuthorResponseDto } from './dto/author.response.dto';
import { AuthorRequestDto } from './dto/author.request.dto';

@Injectable()
export class AuthorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAuthors(): Promise<AuthorResponseDto[]> {
    const prisma = this.prisma as unknown as {
      author: {
        findMany: (args: unknown) => Promise<AuthorResponseDto[]>;
      };
    };

    return prisma.author.findMany({
      orderBy: { name: 'asc' },
      include: {
        books: {
          include: {
            book: true,
          },
        },
      },
    });
  }

  async getAuthorById(id: string): Promise<AuthorResponseDto> {
    const prisma = this.prisma as unknown as {
      author: {
        findUnique: (args: unknown) => Promise<AuthorResponseDto>;
      };
    };

    return prisma.author.findUnique({
      where: { id },
      include: {
        books: {
          include: {
            book: true,
          },
        },
      },
    });
  }
  async createAuthor(author: AuthorRequestDto): Promise<AuthorResponseDto> {
    return this.prisma.author.create({
      data: author,
    });
  }
  async deleteAuthor(id: string): Promise<void> {
    return await this.prisma.$transaction(async (prisma) => {
      // Xóa các liên kết với sách trong bảng trung gian
      await prisma.bookAuthor.deleteMany({
        where: { authorId: id },
      });
      // Xóa tác giả
      await prisma.author.delete({
        where: { id },
      });
    });
  }
  async updateAuthor(
    id: string,
    authorDto: AuthorRequestDto,
  ): Promise<AuthorResponseDto> {
    return this.prisma.author.update({
      where: { id },
      data: authorDto,
    });
  }
}
