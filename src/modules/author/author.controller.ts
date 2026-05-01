import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiResponse } from 'src/common/api-response';
import { AuthorService } from './author.service';
import { AuthorRequestDto } from './dto/author.request.dto';
import { AuthorResponseDto } from './dto/author.response.dto';
import { AuthorUpdateRequestDto } from './dto/author-update.request.dto';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from '../roles/roles.enum';

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

  @Post('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async createAuthor(
    @Body() authorDto: AuthorRequestDto,
  ): Promise<ApiResponse<AuthorResponseDto>> {
    const author = await this.authorService.createAuthor(authorDto);
    return ApiResponse.ok(author, 'Tạo tác giả thành công');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async deleteAuthor(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    await this.authorService.deleteAuthor(id);
    return ApiResponse.message('Xóa tác giả thành công');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async updateAuthor(
    @Param('id') id: string,
    @Body() authorDto: AuthorUpdateRequestDto,
  ): Promise<ApiResponse<AuthorResponseDto>> {
    const author = await this.authorService.updateAuthor(id, authorDto);
    return ApiResponse.ok(author, 'Cập nhật thông tin tác giả thành công');
  }
}
