import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export const VOUCHER_DISCOUNT_TYPES = ['FIXED_AMOUNT', 'PERCENTAGE'] as const;
export type DiscountType = (typeof VOUCHER_DISCOUNT_TYPES)[number];

export class VouchersRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'code không được để trống' })
  @MaxLength(50, { message: 'code tối đa 50 ký tự' })
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsIn(VOUCHER_DISCOUNT_TYPES, { message: 'discountType không hợp lệ' })
  discountType!: DiscountType;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  discountValue!: number;

  @IsOptional()
  @Transform(({ value }) => (value === null ? null : Number(value)))
  @IsNumber()
  @Min(0)
  maxDiscount?: number | null;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsDateString({}, { message: 'startDate không đúng định dạng' })
  startDate!: string;

  @IsDateString({}, { message: 'endDate không đúng định dạng' })
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
