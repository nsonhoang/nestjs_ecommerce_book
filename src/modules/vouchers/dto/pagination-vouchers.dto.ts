import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class PaginateVouchersDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  })
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  now?: boolean;

  @IsOptional()
  @IsIn(['createdAt', 'code', 'startDate', 'endDate', 'usedCount'])
  override sortBy:
    | 'createdAt'
    | 'code'
    | 'startDate'
    | 'endDate'
    | 'usedCount' = 'createdAt';
}
