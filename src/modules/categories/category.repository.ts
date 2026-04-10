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
    const deletedCategory = this.prisma.category.delete({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });
    return deletedCategory.then(() => true).catch(() => false);
  }
}
