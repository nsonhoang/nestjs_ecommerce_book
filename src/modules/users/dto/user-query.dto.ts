// src/modules/users/dto/user-query.dto.ts
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class UserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['createdAt', 'email', 'name'])
  override sortBy: 'createdAt' | 'email' | 'name' = 'createdAt';
}
