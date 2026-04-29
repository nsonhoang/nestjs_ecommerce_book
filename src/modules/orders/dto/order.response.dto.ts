import { OrderPaymentMethod, OrderStatus } from 'generated/prisma/enums';
import { ShipmentResponseDto } from 'src/modules/shipments/dto/shipment.response';

export class OrderItemResponseDto {
  id!: string;
  orderId!: string;
  bookId!: string;
  bookTitle!: string;
  quantity!: number;
  unitPrice!: number;
  discountAmount!: number;
  totalAmount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class OrderResponseDto {
  id!: string;
  code!: string;
  userId!: string;
  status!: OrderStatus;
  paymentMethod!: OrderPaymentMethod;
  subtotalAmount!: number;
  discountAmount!: number;
  shippingFee!: number;
  totalAmount!: number;
  shippingName!: string;
  shippingPhone!: string;
  shippingAddress!: string; // filed này sẽ gộp chứ của máu thhawnfg ward lại thành 1 trường để dễ hiển thị, còn trong db vẫn lưu riêng
  shippingWard!: string;
  shippingWardCode?: string | null;
  shippingDistrict!: string;
  shippingDistrictId?: number | null;
  shippingCity!: string;
  shippingCountry!: string;
  note?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  shipment?: ShipmentResponseDto | null;
  items!: OrderItemResponseDto[];
}
