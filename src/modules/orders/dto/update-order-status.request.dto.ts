import { IsEnum } from 'class-validator';
import { OrderStatus } from 'generated/prisma/enums';

export class UpdateOrderStatusRequestDto {
  @IsEnum(OrderStatus, { message: 'Trạng thái đơn hàng không hợp lệ' })
  status!: OrderStatus;
}
