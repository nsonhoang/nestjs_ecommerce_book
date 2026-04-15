import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { ImageBookRepository } from './image-book.repository';
import { MediaService, UploadFile } from 'src/media/media.service';
import { ImagePosition } from 'src/common/Enum/image-position.enum';
import { BookImageResponseDto } from './dto/book-image.response';
import { BookImageRequestDto } from './dto/book-image.request';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImageBookService {
  private readonly logger = new Logger(ImageBookService.name);
  constructor(
    private readonly imageBookRepository: ImageBookRepository,
    private readonly mediaService: MediaService,
    private readonly prisma: PrismaService,
    // private readonly bookService: BookService, bỏ kh để thằng con gọi thằng cha, còn thằng cha gọi thằng con thì vẫn được
  ) {}

  async getImages(): Promise<BookImageResponseDto[]> {
    try {
      return this.imageBookRepository.getImages();
    } catch (error) {
      this.logger.error('Error fetching book images', error);
      throw new BadRequestException('Failed to fetch book images');
    }
  }

  async getImagesByBookId(bookId: string): Promise<BookImageResponseDto[]> {
    void bookId;
    const images = await this.imageBookRepository.getImagesByBookId(bookId);
    return Promise.resolve(images);
  }

  async deleteImagesByBookId(bookId: string) {
    // 1. Lấy danh sách ảnh từ DB
    const images = await this.imageBookRepository.getImagesByBookId(bookId);

    console.log('images', images);
    const publicIds = images.map((img) => img.publicId);

    // 2. KIỂM TRA: Nếu có ảnh thì mới gọi Cloudinary
    if (publicIds.length > 0) {
      try {
        await this.mediaService.deleteMultipleFiles(publicIds);
        console.log(`Đã xóa ${publicIds.length} ảnh trên Cloudinary`);
      } catch (error) {
        // Chỉ log lỗi, không 'throw' để tránh làm hỏng luồng xóa Book
        this.logger.error(
          'Không thể xóa ảnh trên Cloudinary, nhưng vẫn tiếp tục xóa DB',
          error,
        );
      }
    } else {
      // Nếu mảng rỗng, chỉ cần log thông báo và đi tiếp
      console.log('Sách này không có ảnh, bỏ qua bước xóa trên Cloudinary.');
    }

    // 3. Luôn thực hiện xóa trong DB
    // Dù trên Cloud có hay không, ta vẫn phải xóa bảng ImageBook cho sạch
    await this.imageBookRepository.deleteImagesByBookId(bookId);
  }

  async deleteImageById(imageId: string): Promise<void> {
    try {
      const image = await this.imageBookRepository.getImageById(imageId);
      if (!image) {
        throw new BadRequestException('Không tìm thấy ảnh');
      }
      await this.mediaService.deleteFile(image.publicId);
      await this.imageBookRepository.deleteImageById(imageId);
    } catch (error) {
      this.logger.error('Error deleting image by ID', error);
      throw new BadRequestException('Failed to delete image by ID');
    }
  }

  async createImageForBook(
    request: BookImageRequestDto,
    file: UploadFile[],
  ): Promise<BookImageResponseDto[]> {
    try {
      const book = await this.prisma.book.findUnique({
        where: { id: request.bookId },
        include: { images: true },
      });
      if (!book) {
        throw new BadRequestException('Không tìm thấy sách');
      }

      const uploadedImages = (await this.mediaService.uploadMultipleFiles(
        ImagePosition.IMAGE_BOOK,
        file,
      )) as Array<{ secure_url: string; public_id: string }>;
      const dataRequest = {
        bookId: request.bookId,
        images: uploadedImages.map((image) => ({
          url: image.secure_url,
          publicId: image.public_id,
        })),
      };
      return this.imageBookRepository.createImageForBook(dataRequest);
    } catch (error) {
      this.logger.error('Error creating image for book', error);
      throw new BadRequestException('Failed to create image for book');
    }
  }

  async deleteImageByPublicId(publicId: string[]): Promise<void> {
    try {
      await this.mediaService.deleteMultipleFiles(publicId);
      console.log('Xóa thành công rồi nhé', publicId);

      await this.imageBookRepository.deleteImagesByPublicIds(publicId);
    } catch (error) {
      this.logger.error('Error deleting image', error);
      throw new BadRequestException('Failed to delete image');
    }
  }
}
