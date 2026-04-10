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
import { CategoryService } from './category.service';
import { AuthRole } from '../roles/roles.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CategoryRequestDto } from './dto/categories.request.dto';
import { CategoryResponseDto } from './dto/categories.response.dto';

@Controller('/v1/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async createCategory(
    @Body() categoryDto: CategoryRequestDto,
  ): Promise<ApiResponse<CategoryResponseDto>> {
    return ApiResponse.ok(
      await this.categoryService.createCategory(categoryDto),
      'Tạo danh mục thành công',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async updateCategory(
    @Param('id') id: string,
    @Body() categoryDto: CategoryRequestDto,
  ): Promise<ApiResponse<CategoryResponseDto>> {
    return ApiResponse.ok(
      await this.categoryService.updateCategory(id, categoryDto),
      'Cập nhật danh mục thành công',
    );
  }

  @Get('')
  async getCategories(): Promise<ApiResponse<CategoryResponseDto[]>> {
    return ApiResponse.ok(
      await this.categoryService.getCategories(),
      'Lấy danh sách danh mục thành công',
    );
  }

  @Get(':id')
  async getCategoryById(
    @Param('id') id: string,
  ): Promise<ApiResponse<CategoryResponseDto>> {
    return ApiResponse.ok(
      await this.categoryService.getCategoryById(id),
      'Lấy thông tin danh mục thành công',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async deleteCategory(@Param('id') id: string): Promise<ApiResponse<void>> {
    const result = await this.categoryService.deleteCategory(id);
    return ApiResponse.ok(result, 'Xóa danh mục thành công');
  }
}
