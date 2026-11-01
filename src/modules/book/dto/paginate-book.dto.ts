import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class PaginateBookDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsUUID('all', { message: 'ID danh mục không hợp lệ' })
  categoryId?: string; //cái này để lọc sách theo danh mục, nếu có

  @IsOptional()
  @IsString()
  @IsUUID('all', { message: 'ID tác giả không hợp lệ' })
  authorId?: string; //cái này để lọc sách theo tác giả, nếu có

  @IsOptional()
  @IsString()
  @IsUUID('all', { message: 'ID chương trình khuyến mãi không hợp lệ' })
  promotionId?: string; //cái này để lọc sách theo chương trình khuyến mãi, nếu có
}
