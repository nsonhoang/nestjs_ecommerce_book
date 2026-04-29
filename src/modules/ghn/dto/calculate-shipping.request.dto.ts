import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export type GhnCheckoutPaymentMethod = 'COD' | 'VNPAY';

export class GhnCalculateShippingRequestDto {
  @IsInt({ message: 'to_district_id phải là số nguyên' })
  @IsNotEmpty({ message: 'to_district_id là bắt buộc' })
  @Type(() => Number)
  to_district_id!: number;

  @IsString({ message: 'to_ward_code phải là chuỗi' })
  @IsNotEmpty({ message: 'to_ward_code là bắt buộc' })
  to_ward_code!: string;

  @IsInt({ message: 'weight phải là số nguyên (gram)' })
  @Min(1, { message: 'weight phải > 0' })
  @Type(() => Number)
  weight!: number;

  @IsInt({ message: 'height phải là số nguyên' })
  @Min(1, { message: 'height phải > 0' })
  @Type(() => Number)
  height!: number;

  @IsInt({ message: 'length phải là số nguyên' })
  @Min(1, { message: 'length phải > 0' })
  @Type(() => Number)
  length!: number;

  @IsInt({ message: 'width phải là số nguyên' })
  @Min(1, { message: 'width phải > 0' })
  @Type(() => Number)
  width!: number;

  // Tiền hàng sau giảm (không gồm ship). Dùng để tính COD value.
  @IsInt({ message: 'orderAmount phải là số nguyên' })
  @Min(0, { message: 'orderAmount không được âm' })
  @Type(() => Number)
  orderAmount!: number;

  @IsIn(['COD', 'VNPAY'], { message: 'paymentMethod không hợp lệ' })
  paymentMethod!: GhnCheckoutPaymentMethod;

  @IsOptional()
  @IsInt({ message: 'insurance_value phải là số nguyên' })
  @Min(0, { message: 'insurance_value không được âm' })
  @Type(() => Number)
  insurance_value?: number;

  @IsOptional()
  @IsString({ message: 'coupon phải là chuỗi' })
  coupon?: string;
}
