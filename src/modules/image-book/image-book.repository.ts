import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImageBookRepository {
  constructor(private readonly prisma: PrismaService) {}

  getImages(): Promise<unknown[]> {
    // TODO: Switch to prisma.bookImage queries after regenerating Prisma Client.
    return Promise.resolve([]);
  }

  getImagesByBookId(bookId: string): Promise<unknown[]> {
    void bookId;
    // TODO: Switch to prisma.bookImage queries after regenerating Prisma Client.
    return Promise.resolve([]);
  }
}
