import { Prisma } from 'generated/prisma/client';

export class ShipmentRequestDto {
  id?: string | undefined;
  ghnOrderCode?: string | null | undefined;
  shippingService?: string | undefined;
  status?: string | undefined;
  codAmount!: number;
  shippingFee!: number;
  expectedDelivery?: string | Date | null | undefined;
  shippedAt?: string | Date | null | undefined;
  deliveredAt?: string | Date | null | undefined;
  createdAt?: string | Date | undefined;
  updatedAt?: string | Date | undefined;
  orderId!: string;
}
