export class OrderCreatedEvent {
  static readonly EVENT_NAME = 'order.created';

  constructor(
    public readonly orderId: string,
    public readonly orderCode: string,
    public readonly userId: string,
    public readonly totalAmount: number,
    public readonly cartItemIds: string[],
    public readonly items: Array<{
      bookId: string;
      bookTitle: string;
      quantity: number;
      unitPrice: number;
    }>,
  ) {}
}
