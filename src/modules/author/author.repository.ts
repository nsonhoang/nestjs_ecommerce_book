import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuthorResponseDto } from './dto/author.response.dto';

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
}
