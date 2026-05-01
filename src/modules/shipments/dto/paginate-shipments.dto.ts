import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class PaginateShipmentsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'orderId không hợp lệ' })
  orderId?: string;

  @IsOptional()
  @IsString()
  ghnOrderCode?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  shippingService?: string;

  // Lọc theo ngày tạo
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Định dạng ngày bắt đầu không hợp lệ (ISO 8601)' },
  )
  createFrom?: Date;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Định dạng ngày kết thúc không hợp lệ (ISO 8601)' },
  )
  createTo?: Date;

  // Lọc theo thời gian bắt đầu giao
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Định dạng shippedFrom không hợp lệ (ISO 8601)' },
  )
  shippedFrom?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'Định dạng shippedTo không hợp lệ (ISO 8601)' })
  shippedTo?: Date;

  // Lọc theo thời gian giao thành công
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Định dạng deliveredFrom không hợp lệ (ISO 8601)' },
  )
  deliveredFrom?: Date;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Định dạng deliveredTo không hợp lệ (ISO 8601)' },
  )
  deliveredTo?: Date;

  @IsOptional()
  @IsIn(
    [
      'createdAt',
      'updatedAt',
      'expectedDelivery',
      'shippedAt',
      'deliveredAt',
      'shippingFee',
      'codAmount',
      'status',
    ],
    { message: 'sortBy không hợp lệ' },
  )
  override sortBy:
    | 'createdAt'
    | 'updatedAt'
    | 'expectedDelivery'
    | 'shippedAt'
    | 'deliveredAt'
    | 'shippingFee'
    | 'codAmount'
    | 'status' = 'createdAt';
}
