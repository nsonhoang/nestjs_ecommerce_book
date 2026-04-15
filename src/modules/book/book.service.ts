import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { BookRepository } from './book.repository';
import { BookRequestDto } from './dto/book.request.dto';
import { CategoryService } from '../categories/category.service';
import { AuthorService } from '../author/author.service';
import { BookUpdateRequestDto } from './dto/book-update.request.dto';
import { BookResponseDto } from './dto/book.response.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { PaginateBookDto } from './dto/paginate-book.dto';
import { MediaService, UploadFile } from 'src/media/media.service';
import { ImagePosition } from 'src/common/Enum/image-position.enum';
import { ImageBookService } from '../image-book/image-book.service';

@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);
  constructor(
    private readonly bookRepository: BookRepository,
    private readonly categoryService: CategoryService,
    private readonly authorService: AuthorService,
    private readonly mediaService: MediaService,
    private readonly imageBookService: ImageBookService,
  ) {}

  async getBooks(
    query: PaginateBookDto,
  ): Promise<PaginatedResult<BookResponseDto>> {
    try {
      return this.bookRepository.getBooks(query);
    } catch (error) {
      this.logger.error('Error occurred while fetching books', error);
      throw new BadRequestException('Không thể lấy danh sách sách');
    }
  }

  async getBookById(id: string) {
    const book = await this.bookRepository.getBookById(id);
    if (!book) {
      throw new NotFoundException('Không tìm thấy sách');
    }
    return book;
  }

  async createBook(request: BookRequestDto, file: UploadFile) {
    try {
      const uploadedImage = await this.mediaService.uploadFile(
        ImagePosition.THUMBNAIL,
        file,
      );

      const bookData = {
        ...request,
        thumbnail: uploadedImage.secure_url as string,
      };

      await Promise.all(
        request.categoryId.map(async (id) => {
          const category = await this.categoryService.findById(id);
          if (!category) {
            throw new NotFoundException(`Danh mục với id ${id} không tồn tại`);
          }
        }),
      );

      await Promise.all(
        request.authorId.map(async (id) => {
          const author = await this.authorService.getAuthorById(id);
          if (!author) {
            throw new NotFoundException(`Tác giả với id ${id} không tồn tại`);
          }
        }),
      );

      return this.bookRepository.createBook(bookData);
    } catch (error) {
      this.logger.error('Error occurred while creating book', error);
      throw new BadRequestException('Không thể thêm sách');
    }
  }

  async deleteBook(id: string) {
    //phải kiểm tra các bảng trung gian xem sách có liên quan đến tác giả hay danh mục nào không, nếu có thì không được xóa
    try {
      const book = await this.getBookById(id);
      if (!book) {
        throw new NotFoundException('Không tìm thấy sách');
      }

      // Xóa ảnh liên quan đến sách trên Cloudinary và trong database
      await this.imageBookService.deleteImagesByBookId(id);
      console.log('Đã xóa ảnh liên quan đến sách với id:', id);

      await this.imageBookService.deleteImagesByBookId(id);

      await this.bookRepository.deleteBook(id);
    } catch (error) {
      this.logger.error('Error occurred while deleting book', error);
      throw new BadRequestException('Không thể xóa sách'); // Trả về lỗi chung cho client
    }
  }

  async updateBook(
    id: string,
    request: BookUpdateRequestDto,
  ): Promise<BookResponseDto> {
    //nếu muốn sửa categoryId hoặc authorId thì chỉ cần cập nhật bảng trung gian là đc

    try {
      if (request.categoryId) {
        await Promise.all(
          request.categoryId.map(async (id) => {
            const category = await this.categoryService.findById(id);
            if (!category) {
              throw new NotFoundException(
                `Danh mục với id ${id} không tồn tại`,
              );
            }
          }),
        );
      }
      if (request.authorId) {
        await Promise.all(
          request.authorId.map(async (id) => {
            const author = await this.authorService.getAuthorById(id);
            if (!author) {
              throw new NotFoundException(`Tác giả với id ${id} không tồn tại`);
            }
          }),
        );
      }

      return this.bookRepository.updateBook(id, request);
    } catch (error) {
      this.logger.error('Error occurred while updating book', error);
      throw new BadRequestException('Không thể cập nhật sách'); // Trả về lỗi chung cho client
    }
  }

  // async getBooksByAuthorId(authorId: string) {
  //   try {
  //     return this.bookRepository.getBooksByAuthorId(authorId);
  //   } catch (error) {
  //     this.logger.error('Error occurred while fetching books by author', error);
  //     throw new BadRequestException('Không thể lấy sách theo tác giả');
  //   }
  // }

  // async getBooksByCategoryId(categoryId: string) {
  //   try {
  //     return this.bookRepository.getBooksByCategoryId(categoryId);
  //   } catch (error) {
  //     this.logger.error(
  //       'Error occurred while fetching books by category',
  //       error,
  //     );
  //     throw new BadRequestException('Không thể lấy sách theo danh mục');
  //   }
  // }
}
