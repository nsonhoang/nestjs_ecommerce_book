import { Injectable, NotFoundException } from '@nestjs/common';

import { AuthorRepository } from './author.repository';

@Injectable()
export class AuthorService {
  constructor(private readonly authorRepository: AuthorRepository) {}

  async getAuthors(): Promise<unknown[]> {
    const authors = await this.authorRepository.getAuthors();
    return authors;
  }

  async getAuthorById(id: string): Promise<unknown> {
    const author = await this.authorRepository.getAuthorById(id);
    if (!author) {
      throw new NotFoundException('Không tìm thấy tác giả');
    }
    return author;
  }
}
