import { PartialType } from '@nestjs/mapped-types';
import { PromotionRequestDto } from './promotion.request.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class PromotionUpdateRequestDto extends PartialType(
  PromotionRequestDto,
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean; // Thêm trường isActive để cho phép Admin kích hoạt hoặc hủy kích hoạt chương trình khuyến mãi
}
