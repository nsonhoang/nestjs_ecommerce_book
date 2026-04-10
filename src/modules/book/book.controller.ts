import { Controller, Get, Param } from '@nestjs/common';

import { ApiResponse } from 'src/common/api-response';
import { BookService } from './book.service';

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
}
