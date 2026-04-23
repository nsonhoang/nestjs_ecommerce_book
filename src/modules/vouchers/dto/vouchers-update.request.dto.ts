import { VouchersRequestDto } from './vouchers.request.dto';

import { OmitType, PartialType } from '@nestjs/mapped-types';

/**
 * Loại bỏ các trường bất biến:
 * - code: Định danh
 * - discountType: Loại giảm giá
 * - discountValue: Giá trị giảm
 * - maxDiscount: Giảm tối đa
 * - minOrderValue: Đơn hàng tối thiểu
 */
export class VouchersUpdateRequestDto extends PartialType(
  OmitType(VouchersRequestDto, [
    'code',
    'discountType',
    'discountValue',
    'maxDiscount',
    'minOrderValue',
  ] as const),
) {}

// export class VouchersUpdateRequestDto {
//   //không cho sửa code
//   // @IsOptional()
//   // @IsString()
//   // @MaxLength(50)
//   // code?: string;

//   @IsOptional()
//   @IsString()
//   @MaxLength(255)
//   description?: string;

//   // @IsOptional()
//   // @IsIn(VOUCHER_DISCOUNT_TYPES)
//   // discountType?: DiscountType;

//   @IsOptional()
//   @Transform(({ value }) => Number(value))
//   @IsNumber()
//   @Min(0)
//   discountValue?: number;

//   @IsOptional()
//   @Transform(({ value }) => (value === null ? null : Number(value)))
//   @IsNumber()
//   @Min(0)
//   maxDiscount?: number | null;

//   @IsOptional()
//   @Transform(({ value }) => Number(value))
//   @IsNumber()
//   @Min(0)
//   minOrderValue?: number;

//   @IsOptional()
//   @Transform(({ value }) => Number(value))
//   @IsNumber()
//   @Min(1)
//   usageLimit?: number;

//   @IsOptional()
//   @Transform(({ value }) => Number(value))
//   @IsNumber()
//   @Min(0)
//   usedCount?: number;

//   @IsOptional()
//   @IsDateString()
//   startDate?: string;

//   @IsOptional()
//   @IsDateString()
//   endDate?: string;

//   @IsOptional()
//   @IsBoolean()
//   isActive?: boolean;
// }
