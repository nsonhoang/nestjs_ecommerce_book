export class ShipmentResponseDto {
  id!: string;
  orderId!: string;
  ghnOrderCode?: string | null;
  shippingService!: string;
  status!: string;
  codAmount!: number;
  shippingFee!: number;
  expectedDelivery?: Date | null;
  deliveredAt?: Date | null;
  shippedAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
