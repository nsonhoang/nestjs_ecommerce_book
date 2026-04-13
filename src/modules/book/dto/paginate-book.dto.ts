import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class PaginateBookDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  categoryId?: string; //cái này để lọc sách theo danh mục, nếu có

  @IsOptional()
  @IsString()
  authorId?: string; //cái này để lọc sách theo tác giả, nếu có
}
