import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { AuthorRepository } from './author.repository';
import { AuthorRequestDto } from './dto/author.request.dto';
import { AuthorResponseDto } from './dto/author.response.dto';

@Injectable()
export class AuthorService {
  private readonly logger: Logger = new Logger(AuthorService.name);
  constructor(private readonly authorRepository: AuthorRepository) {}

  async getAuthors(): Promise<AuthorResponseDto[]> {
    const authors = await this.authorRepository.getAuthors();
    return authors;
  }

  async getAuthorById(id: string): Promise<AuthorResponseDto> {
    const author = await this.authorRepository.getAuthorById(id);
    if (!author) {
      throw new NotFoundException('Không tìm thấy tác giả');
    }
    return author;
  }
  async createAuthor(author: AuthorRequestDto): Promise<AuthorResponseDto> {
    try {
      return await this.authorRepository.createAuthor(author);
    } catch (error) {
      this.logger.error('Error creating author', error);
      throw new BadRequestException('Không thể tạo tác giả'); // Trả về lỗi chung cho client
    }
  }
  async deleteAuthor(id: string): Promise<void> {
    try {
      const author = await this.getAuthorById(id);
      if (!author) {
        throw new NotFoundException('Không tìm thấy tác giả');
      }

      await this.authorRepository.deleteAuthor(id);
    } catch (error) {
      this.logger.error('Error deleting author', error);
      throw new BadRequestException('Không thể xóa tác giả'); // Trả về lỗi chung cho client
    }
  }

  async updateAuthor(
    id: string,
    authorDto: AuthorRequestDto,
  ): Promise<AuthorResponseDto> {
    try {
      const existingAuthor = await this.getAuthorById(id);
      if (!existingAuthor) {
        throw new NotFoundException('Không tìm thấy tác giả');
      }
      return await this.authorRepository.updateAuthor(id, authorDto);
    } catch (error) {
      this.logger.error('Error updating author', error);
      throw new BadRequestException('Không thể sửa tác giả'); // Trả về lỗi chung cho client
    }
  }
  async findAuthorsByIds(ids: string[]) {
    return this.authorRepository.findByManyByIds(ids);
  }
}
