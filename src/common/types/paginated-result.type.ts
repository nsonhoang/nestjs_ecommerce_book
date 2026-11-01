// src/common/types/paginated-result.type.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiPropertyOptional({
    example: 1,
    description: 'Trang hiện tại (chế độ phân trang số)',
  })
  page?: number;

  @ApiProperty({ example: 10, description: 'Số lượng phần tử mỗi trang' })
  limit!: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Tổng số bản ghi trong hệ thống',
  })
  total?: number;

  @ApiPropertyOptional({ example: 10, description: 'Tổng số trang' })
  totalPages?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Còn trang kế tiếp hay không',
  })
  hasNextPage?: boolean;

  @ApiPropertyOptional({
    example: '0192e4a9-86d4-71aa-b685-bb9a6d616326',
    description: 'Con trỏ dùng để gọi trang tiếp theo (Cursor Pagination)',
    nullable: true,
  })
  nextCursor?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
