import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ApiResponse } from 'src/common/api-response';
import { BookService } from './book.service';
import { BookRequestDto } from './dto/book.request.dto';
import { BookResponseDto } from './dto/book.response.dto';
import { BookUpdateRequestDto } from './dto/book-update.request.dto';

@Controller('/v1/books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get('')
  async getBooks() {
    const books = await this.bookService.getBooks();
    return ApiResponse.ok(books, 'Lấy danh sách sách thành công');
  }

  @Get(':id')
  async getBookById(@Param('id') id: string) {
    const book = await this.bookService.getBookById(id);
    return ApiResponse.ok(book, 'Lấy thông tin sách thành công');
  }

  @Post('')
  async createBook(
    @Body() bookDto: BookRequestDto,
  ): Promise<ApiResponse<BookResponseDto>> {
    const book = await this.bookService.createBook(bookDto);
    return ApiResponse.ok(book, 'Tạo sách thành công');
  }

  @Patch(':id')
  async updateBook(
    @Param('id') id: string,
    @Body() bookDto: BookUpdateRequestDto,
  ): Promise<ApiResponse<BookResponseDto>> {
    const book = await this.bookService.updateBook(id, bookDto);
    return ApiResponse.ok(book, 'Cập nhật sách thành công');
  }

  @Delete(':id')
  async deleteBook(@Param('id') id: string) {
    await this.bookService.deleteBook(id);
    return ApiResponse.message('Xóa sách thành công');
  }
}
