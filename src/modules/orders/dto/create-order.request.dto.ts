import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OrderPaymentMethod } from 'generated/prisma/enums';

export class CreateOrderRequestDto {
  @ApiProperty({ example: ['cart-item-id'] })
  @IsNotEmpty({ message: 'Chọn 1 sản phẩm để mua' })
  cardItemIds!: string[]; // cho chọn danh sách các item trong đơn hàng

  @ApiProperty({ enum: OrderPaymentMethod, example: OrderPaymentMethod.COD })
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

  // cái này tính bàng api ghn trả về, đừng tin tưởng client gửi lên
  // @IsInt({ message: 'Phí vận chuyển phải là số nguyên' })
  // @Min(0, { message: 'Phí vận chuyển không được âm' })
  // @IsOptional()
  // shippingFee?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'Giao giờ hành chính' })
  note?: string;

  @ApiPropertyOptional({ example: 'SUMMER2026' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  voucherCode?: string;
}
