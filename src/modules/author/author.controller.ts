import { Controller, Get, Param } from '@nestjs/common';

import { ApiResponse } from 'src/common/api-response';
import { AuthorService } from './author.service';

@Controller('/v1/authors')
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @Get('')
  async getAuthors() {
    const authors = await this.authorService.getAuthors();
    return ApiResponse.ok(authors, 'Lấy danh sách tác giả thành công');
  }

  @Get(':id')
  async getAuthorById(@Param('id') id: string) {
    const author = await this.authorService.getAuthorById(id);
    return ApiResponse.ok(author, 'Lấy thông tin tác giả thành công');
  }
}
