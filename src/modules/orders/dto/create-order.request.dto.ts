import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { OrderPaymentMethod } from 'generated/prisma/enums';

export class CreateOrderRequestDto {
  @IsNotEmpty({ message: 'Chọn 1 sản phẩm để mua' })
  cardItemIds!: string[]; // cho chọn danh sách các item trong đơn hàng

  @IsEnum(OrderPaymentMethod, {
    message: 'Phương thức thanh toán không hợp lệ',
  })
  paymentMethod!: OrderPaymentMethod;

  // @IsString()
  // shippingName!: string;

  // @IsString()
  // shippingPhone!: string;

  // @IsString()
  // shippingAddress!: string;

  // @IsString()
  // shippingWard!: string;

  // @IsString()
  // shippingDistrict!: string;

  // @IsString()
  // shippingCity!: string;

  // @IsString()
  // @IsOptional()
  // shippingCountry?: string;

  @IsNotEmpty({ message: 'Không có thông tin địa chỉ giao hàng' })
  @IsString()
  addressId!: string;

  @IsInt({ message: 'Phí vận chuyển phải là số nguyên' })
  @Min(0, { message: 'Phí vận chuyển không được âm' })
  @IsOptional()
  shippingFee?: number;

  @IsString()
  @IsOptional()
  note?: string;
}
