import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryRequestDto } from './dto/categories.request.dto';
import { CategoryResponseDto } from './dto/categories.response.dto';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByName(name: string) {
    return this.prisma.category.findUnique({ where: { name } });
  }

  async create(categoryDto: CategoryRequestDto): Promise<CategoryResponseDto> {
    return this.prisma.category.create({
      data: {
        name: categoryDto.name,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }
  async update(
    id: string,
    categoryDto: CategoryRequestDto,
  ): Promise<CategoryResponseDto> {
    return this.prisma.category.update({
      where: { id },
      data: {
        name: categoryDto.name,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }
  async findAll(): Promise<CategoryResponseDto[]> {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });
  }
  async findById(id: string): Promise<CategoryResponseDto | null> {
    return this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });
  }
  async delete(id: string): Promise<boolean> {
    return this.prisma
      .$transaction(async (prisma) => {
        // Xóa các liên kết với sách trong bảng trung gian
        await prisma.bookCategory.deleteMany({
          where: { categoryId: id },
        });
        // Xóa danh mục
        await prisma.category.delete({
          where: { id },
        });
      })
      .then(() => {
        return true;
      });
    // .catch((error) => {
    //   console.error('Error deleting category:', error);
    //   return false;
    // });
  }
}
