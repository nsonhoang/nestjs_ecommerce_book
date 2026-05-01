import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { ApiResponse } from 'src/common/api-response';
import { BookService } from './book.service';
import { BookRequestDto } from './dto/book.request.dto';
import { BookResponseDto } from './dto/book.response.dto';
import { BookUpdateRequestDto } from './dto/book-update.request.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { PaginateBookDto } from './dto/paginate-book.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from '../roles/roles.enum';

@Controller('/v1/books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get('')
  async getBooks(
    @Query() paginationQuery: PaginateBookDto,
  ): Promise<ApiResponse<PaginatedResult<BookResponseDto>>> {
    const books = await this.bookService.getBooks(paginationQuery);
    return ApiResponse.ok(books, 'Lấy danh sách sách thành công');
  }

  @Get(':id')
  async getBookById(@Param('id') id: string) {
    const book = await this.bookService.getBookById(id);
    return ApiResponse.ok(book, 'Lấy thông tin sách thành công');
  }

  @Post('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @UseInterceptors(FileInterceptor('file'))
  async createBook(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: any,
    @Body() bookDto: BookRequestDto,
  ): Promise<ApiResponse<BookResponseDto>> {
    const book = await this.bookService.createBook(bookDto, file);
    return ApiResponse.ok(book, 'Thêm sách thành công');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async updateBook(
    @Param('id') id: string,
    @Body() bookDto: BookUpdateRequestDto,
  ): Promise<ApiResponse<BookResponseDto>> {
    const book = await this.bookService.updateBook(id, bookDto);
    return ApiResponse.ok(book, 'Cập nhật sách thành công');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async deleteBook(@Param('id') id: string) {
    await this.bookService.deleteBook(id);
    return ApiResponse.message('Xóa sách thành công');
  }
}
