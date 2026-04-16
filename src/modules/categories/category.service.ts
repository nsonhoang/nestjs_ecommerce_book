import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CategoryRepository } from './category.repository';
import { CategoryRequestDto } from './dto/categories.request.dto';
import { CategoryResponseDto } from './dto/categories.response.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async createCategory(
    categoryDto: CategoryRequestDto,
  ): Promise<CategoryResponseDto> {
    try {
      const existingCategory = await this.categoryRepository.findByName(
        categoryDto.name,
      );
      if (existingCategory) {
        throw new ConflictException('Danh mục đã tồn tại');
      }
      const category = await this.categoryRepository.create(categoryDto);
      return category;
    } catch (error) {
      this.logger.error('Lỗi khi tạo danh mục', error);

      if (error instanceof HttpException) {
        throw error; // giữ nguyên lỗi gốc
      }

      throw new InternalServerErrorException('Không thể tạo danh mục');
    }
  }

  //sửa danh mục
  async updateCategory(
    id: string,
    categoryDto: CategoryRequestDto,
  ): Promise<CategoryResponseDto> {
    try {
      const existingCategory = await this.categoryRepository.findByName(
        categoryDto.name,
      );
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Danh mục đã tồn tại');
      }
      const category = await this.categoryRepository.update(id, categoryDto);
      return category;
    } catch (error) {
      this.logger.error('Lỗi khi sửa danh mục', error);

      if (error instanceof HttpException) {
        throw error; // giữ nguyên lỗi gốc
      }

      throw new InternalServerErrorException('Không thể sửa danh mục');
    }
  }
  async getCategories(): Promise<CategoryResponseDto[]> {
    return this.categoryRepository.findAll();
  }
  async getCategoryById(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    return category;
  }

  //xóa danh mục, nếu có sản phẩm thuộc danh mục này thì sẽ không cho xóa
  async deleteCategory(id: string): Promise<void> {
    try {
      //phải tìm kiếm sách theo danh mục này trước, nếu có thì sẽ không cho xóa
      const category = await this.getCategoryById(id);
      if (!category) {
        throw new NotFoundException('Danh mục không tồn tại');
      }

      await this.categoryRepository.delete(id);
    } catch (error) {
      this.logger.error('Lỗi khi xóa danh mục', error);
    }
  }
  async findById(id: string): Promise<CategoryResponseDto | null> {
    const category = await this.categoryRepository.findById(id);
    return category;
  }

  async findManyByIds(ids: string[]) {
    return this.categoryRepository.findByManyByIds(ids);
  }
}
