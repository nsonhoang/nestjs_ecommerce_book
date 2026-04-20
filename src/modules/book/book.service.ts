import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
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
import { PromotionResponseDto } from '../promotion/dto/promotion.response';

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
      const books = await this.bookRepository.getBooks(query);

      const discountedBooks = books.data.map((book) => {
        let finalPrice = Number(book.price);
        let maxDiscountRate = 0;
        if (book.promotions && book.promotions.length > 0) {
          maxDiscountRate = this.getMaxDiscount(book.promotions);
          finalPrice = this.calculateDiscountedPrice(
            book.price,
            maxDiscountRate,
          );
        }
        const { promotions, ...cleanBookData } = book;
        return {
          ...cleanBookData,
          priceAfterDiscount: finalPrice,
          discountRate: maxDiscountRate,
        };
      });
      return {
        ...books,
        data: discountedBooks,
      };
    } catch (error) {
      this.logger.error('Error occurred while fetching books', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi tải danh sách sách, vui lòng thử lại sau.',
      );
    }
  }

  private getMaxDiscount(promotions: PromotionResponseDto[]): number {
    if (!promotions || promotions.length === 0) return 0;

    // Lấy ra mức giảm sâu nhất
    return Math.max(...promotions.map((bp) => bp.discountRate));
  }

  private calculateDiscountedPrice(
    price: number,
    discountRate: number,
  ): number {
    if (discountRate <= 0) return price;
    return price - price * (discountRate / 100);
  }

  async getBookById(id: string) {
    const book = await this.bookRepository.getBookById(id);
    if (!book) {
      throw new NotFoundException('Không tìm thấy sách');
    }
    let finalPrice = book.price;
    let maxDiscountRate = 0;
    if (book.promotions && book.promotions.length > 0) {
      maxDiscountRate = this.getMaxDiscount(book.promotions);
      finalPrice = this.calculateDiscountedPrice(
        Number(book.price),
        maxDiscountRate,
      );
      book.discountRate = maxDiscountRate;
      book.priceAfterDiscount = finalPrice;
    }

    return book;
  }

  async createBook(
    request: BookRequestDto,
    file: UploadFile,
  ): Promise<BookResponseDto> {
    try {
      const uploadedImage = await this.mediaService.uploadFile(
        ImagePosition.THUMBNAIL,
        file,
      );

      const bookData = {
        ...request,
        thumbnail: uploadedImage.secure_url as string,
      };
      if (request.categoryId !== undefined && request.categoryId.length > 0) {
        // 1. Lọc bỏ các ID trùng lặp (nếu có) để đếm cho chuẩn
        const uniqueCategoryIds = [...new Set(request.categoryId)];

        // 2. Dùng findMany (chỉ tốn 1 query duy nhất)
        const existingCategories =
          await this.categoryService.findManyByIds(uniqueCategoryIds);

        // 3. So sánh số lượng
        if (existingCategories.length !== uniqueCategoryIds.length) {
          throw new NotFoundException(
            'Một hoặc nhiều danh mục không tồn tại trong hệ thống',
          );
        }
      }
      if (request.authorId !== undefined && request.authorId.length > 0) {
        const uniqueAuthorIds = [...new Set(request.authorId)];
        const existingAuthors =
          await this.authorService.findAuthorsByIds(uniqueAuthorIds);

        if (existingAuthors.length !== uniqueAuthorIds.length) {
          throw new NotFoundException(
            'Một hoặc nhiều tác giả không tồn tại trong hệ thống',
          );
        }
      }

      return this.bookRepository.createBook(bookData);
    } catch (error) {
      this.logger.error('Error occurred while creating book', error);
      throw new InternalServerErrorException('Không thể thêm sách');
    }
  }

  private getPublicIdsFromUrl(url: string): string | null {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    let afterUpload = parts[1];

    // 2. Kiểm tra xem có mã version (bắt đầu bằng 'v' và theo sau là số) không
    // Nếu có, cắt bỏ nó đi
    if (afterUpload.match(/^v\d+\//)) {
      afterUpload = afterUpload.replace(/^v\d+\//, '');
      // Giờ còn: "nestjs_ecommerce/books/thumbnail/qfdgdfu1notyx5g9zlzc.png"
    }

    // 3. Xóa đuôi mở rộng file (.png, .jpg, .jpeg)
    // Cắt từ đầu chuỗi đến vị trí của dấu chấm cuối cùng
    const publicId = afterUpload.substring(0, afterUpload.lastIndexOf('.'));

    return publicId;
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
      // Sau khi đã xóa ảnh, tiến hành xóa sách

      // Xóa thumbnail trên Cloudinary
      const publicIdThumbnail = this.getPublicIdsFromUrl(book.thumbnail);
      if (publicIdThumbnail) {
        await this.mediaService.deleteFile(publicIdThumbnail);
      }

      await this.bookRepository.deleteBook(id);
    } catch (error) {
      this.logger.error('Error occurred while deleting book', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Không thể xóa sách');

      // throw new BadRequestException('Không thể xóa sách'); // Trả về lỗi chung cho client
    }
  }

  async updateBook(
    id: string,
    request: BookUpdateRequestDto,
  ): Promise<BookResponseDto> {
    try {
      // 1. VALIDATE DANH MỤC VÀ TÁC GIẢ
      if (request.categoryId?.length) {
        const uniqueCategoryIds = [...new Set(request.categoryId)];
        const existingCategories =
          await this.categoryService.findManyByIds(uniqueCategoryIds);

        if (existingCategories.length !== uniqueCategoryIds.length) {
          throw new NotFoundException(
            'Một hoặc nhiều danh mục không tồn tại trong hệ thống',
          );
        }
      }

      if (request.authorId?.length) {
        const uniqueAuthorIds = [...new Set(request.authorId)];
        const existingAuthors =
          await this.authorService.findAuthorsByIds(uniqueAuthorIds);

        if (existingAuthors.length !== uniqueAuthorIds.length) {
          throw new NotFoundException(
            'Một hoặc nhiều tác giả không tồn tại trong hệ thống',
          );
        }
      }

      // 2. XỬ LÝ HÌNH ẢNH MỚI (Lưu tạm ID ảnh cũ để dọn rác sau)
      let oldThumbnailPublicId: string | null = null;

      if (request.thumbnail) {
        // Lấy sách cũ ra để chuẩn bị ID xóa
        const existingBook = await this.getBookById(id);
        if (existingBook.thumbnail) {
          oldThumbnailPublicId = this.getPublicIdsFromUrl(
            existingBook.thumbnail,
          );
        }

        // Upload ảnh MỚI lên
        const uploadedImage = await this.mediaService.uploadFile(
          ImagePosition.THUMBNAIL,
          request.thumbnail as unknown as UploadFile,
        );
        // Gán link mới vào request để chuẩn bị lưu DB
        request.thumbnail = uploadedImage.secure_url as string;
      }

      // 3. CẬP NHẬT DATABASE
      const updatedBook = await this.bookRepository.updateBook(id, request);

      // 4. DỌN RÁC CLOUDINARY (Chỉ chạy khi DB đã lưu an toàn)
      if (oldThumbnailPublicId) {
        // Không dùng await ở đây. Cứ ném cho MediaService tự xóa ngầm, API trả về luôn cho nhanh
        this.mediaService.deleteFile(oldThumbnailPublicId).catch((err) => {
          this.logger.error(
            `Không thể xóa ảnh cũ trên Cloud: ${oldThumbnailPublicId}`,
            err,
          );
        });
      }

      return updatedBook;
    } catch (error) {
      // SỬA BẪY SỐ 1: Bắt đúng HttpException thì ném thẳng ra cho Frontend thấy
      if (error instanceof HttpException) {
        throw error;
      }

      // Nếu là lỗi hệ thống (như sập DB, lỗi server...) thì mới log và báo lỗi chung
      this.logger.error('Error occurred while updating book', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống: Không thể cập nhật sách',
      );
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
