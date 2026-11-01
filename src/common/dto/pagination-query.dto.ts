// src/common/dto/pagination-query.dto.ts
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    example: '0192e4a9-86d4-71aa-b685-bb9a6d616326',
    description:
      'Con trỏ trang trước (nếu dùng chế độ cuộn vô tận Cursor Pagination). Bỏ qua nếu dùng phân trang số.',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Số trang hiện tại (nếu dùng chế độ phân trang theo số trang)',
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page = 1;
  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Số lượng phần tử mỗi trang (tối đa 100)',
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @ApiPropertyOptional({
    example: 'Clean Architecture',
    description: 'Từ khóa tìm kiếm',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    default: 'createdAt',
    description: 'Trường sắp xếp',
  })
  @IsOptional()
  @IsString()
  sortBy = 'createdAt';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Thứ tự sắp xếp',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: "sortOrder phải là 'asc' or 'desc'" })
  sortOrder: 'asc' | 'desc' = 'desc';
}
