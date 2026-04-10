import { Injectable, NotFoundException } from '@nestjs/common';

import { BookRepository } from './book.repository';
import { BookRequestDto } from './dto/book.request.dto';
import { CategoryRepository } from '../categories/category.repository';
import { AuthorRepository } from '../author/author.repository';

@Injectable()
export class BookService {
  constructor(
    private readonly bookRepository: BookRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly authorRepository: AuthorRepository,
  ) {}

  async getBooks() {
    return this.bookRepository.getBooks();
  }

  async getBookById(id: string) {
    const book = await this.bookRepository.getBookById(id);
    if (!book) {
      throw new NotFoundException('Không tìm thấy sách');
    }
    return book;
  }
  async createBook(request: BookRequestDto) {
    await Promise.all(
      request.categoryId.map(async (id) => {
        const category = await this.categoryRepository.findById(id);
        if (!category) {
          throw new NotFoundException(`Danh mục với id ${id} không tồn tại`);
        }
      }),
    );
    await Promise.all(
      request.authorId.map(async (id) => {
        const author = await this.authorRepository.getAuthorById(id);
        if (!author) {
          throw new NotFoundException(`Tác giả với id ${id} không tồn tại`);
        }
      }),
    );

    return this.bookRepository.createBook(request);
  }
}
