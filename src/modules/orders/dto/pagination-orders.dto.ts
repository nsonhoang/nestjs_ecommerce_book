import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderPaymentMethod, OrderStatus } from 'generated/prisma/enums';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class PaginateOrderDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'ID người dùng không hợp lệ' })
  userId?: string;

  // Lọc theo ngày tạo
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Định dạng ngày bắt đầu không hợp lệ (ISO 8601)' },
  )
  createFrom?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'Định dạng ngày kết thúc không hợp lệ' })
  createTo?: Date;

  // Lọc theo ngày cập nhật
  @IsOptional()
  @IsDateString({}, { message: 'Định dạng ngày cập nhật bắt đầu không hợp lệ' })
  updateFrom?: Date;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Định dạng ngày cập nhật kết thúc không hợp lệ' },
  )
  updateTo?: Date;

  @IsOptional()
  @IsEnum(OrderPaymentMethod, {
    message: 'Phương thức thanh toán không hợp lệ',
  })
  paymentMethod?: OrderPaymentMethod;

  // Lọc theo tổng tiền - Cần dùng @Type để convert từ chuỗi sang số trên URL
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Số tiền tối thiểu phải là số' })
  @Min(0, { message: 'Số tiền không được âm' })
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Số tiền tối đa phải là số' })
  @Min(0, { message: 'Số tiền không được âm' })
  maxAmount?: number;

  @IsOptional()
  @IsEnum(OrderStatus, {
    message: 'Trạng thái đơn hàng không hợp lệ',
  })
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  shippingPhone?: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  shippingWard?: string;

  @IsOptional()
  @IsString()
  shippingDistrict?: string;

  @IsOptional()
  @IsString()
  shippingCity?: string;
}
