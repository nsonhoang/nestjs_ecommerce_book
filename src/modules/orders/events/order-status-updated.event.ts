import { OrderStatus } from 'generated/prisma/enums';

export class OrderStatusUpdatedEvent {
  static readonly EVENT_NAME = 'order.status_updated';

  constructor(
    public readonly orderId: string,
    public readonly orderCode: string,
    public readonly userId: string,
    public readonly status: OrderStatus,
    public readonly extraMessage?: string,
  ) {}
}
