export class OrderCancelledEvent {
  static readonly EVENT_NAME = 'order.cancelled';

  constructor(
    public readonly orderId: string,
    public readonly orderCode: string,
    public readonly userId: string,
    public readonly reason?: string,
    public readonly items?: Array<{
      bookId: string;
      quantity: number;
    }>,
  ) {}
}
