import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { BookImageResponseDto } from './dto/book-image.response';

type CreateImageForBookInput = {
  bookId: string;
  images: Array<{
    url: string;
    publicId: string;
  }>;
};

@Injectable()
export class ImageBookRepository {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeId(value: string): string {
    return value.trim().toLowerCase();
  }

  getImages(): Promise<BookImageResponseDto[]> {
    return this.prisma.bookImage.findMany();
  }

  getImageById(imageId: string): Promise<BookImageResponseDto | null> {
    return this.prisma.bookImage.findUnique({
      where: { id: this.normalizeId(imageId) },
    });
  }

  async getImagesByBookId(bookId: string): Promise<BookImageResponseDto[]> {
    return this.prisma.bookImage.findMany({
      where: { bookId: this.normalizeId(bookId) },
    });
  }

  async createImageForBook(
    request: CreateImageForBookInput,
  ): Promise<BookImageResponseDto[]> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Thực hiện chèn hàng loạt
      const photos = await prisma.bookImage.createMany({
        data: request.images.map((image) => ({
          bookId: this.normalizeId(request.bookId),
          url: image.url,
          publicId: image.publicId,
        })),
      });

      const images = await prisma.bookImage.findMany({
        where: {
          bookId: this.normalizeId(request.bookId),
          publicId: { in: request.images.map((image) => image.publicId) },
        },
      });

      return images;
    });
  }

  async deleteImagesByPublicIds(publicIds: string[]): Promise<void> {
    await this.prisma.bookImage.deleteMany({
      where: {
        publicId: { in: publicIds },
      },
    });
  }
  async deleteImagesByBookId(bookId: string): Promise<void> {
    //nếu xóa sach thì xóa hết ảnh
    await this.prisma.bookImage.deleteMany({
      where: {
        bookId: this.normalizeId(bookId),
      },
    });
  }
  async deleteImageById(imageId: string): Promise<void> {
    await this.prisma.bookImage.delete({
      where: {
        id: this.normalizeId(imageId),
      },
    });
  }
}
