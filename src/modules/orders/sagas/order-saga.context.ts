import { JwtUser } from 'src/strategies/jwt-payload.interface';
import { CreateOrderRequestDto } from '../dto/create-order.request.dto';
import { OrderResponseDto } from '../dto/order.response.dto';
import { AddressResponseDTO } from 'src/modules/address/dto/address.response';

export type SagaOrderItemPayload = {
  bookId: string;
  bookTitle: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
};

export interface CreateOrderSagaContext {
  user: JwtUser;
  request: CreateOrderRequestDto;
  address: AddressResponseDTO;
  orderCode: string;
  items: SagaOrderItemPayload[];
  subtotalAmount: number;
  promotionDiscountAmount: number;
  voucherId?: string;
  voucherDiscountAmount?: number;
  reservedItems: Array<{ bookId: string; quantity: number }>;
  createdOrder?: OrderResponseDto;
}
