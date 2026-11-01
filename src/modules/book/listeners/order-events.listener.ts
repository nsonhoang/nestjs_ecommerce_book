import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookService } from '../book.service';
import { OrderCreatedEvent } from '../../orders/events/order-created.event';
import { OrderCancelledEvent } from '../../orders/events/order-cancelled.event';

@Injectable()
export class BookOrderEventListener {
  private readonly logger = new Logger(BookOrderEventListener.name);

  constructor(private readonly bookService: BookService) {}

  @OnEvent(OrderCreatedEvent.EVENT_NAME)
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      this.logger.log(
        `Updating soldCount for ${event.items.length} books in order ${event.orderCode}`,
      );
      for (const item of event.items) {
        await this.bookService.updateSoldCount(item.bookId, item.quantity);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update soldCount for order ${event.orderCode}`,
        error,
      );
    }
  }

  @OnEvent(OrderCancelledEvent.EVENT_NAME)
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    try {
      if (event.items && event.items.length > 0) {
        this.logger.log(
          `Decreasing soldCount for ${event.items.length} books on cancelled order ${event.orderCode}`,
        );
        for (const item of event.items) {
          await this.bookService.decreaseSoldCount(item.bookId, item.quantity);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to decrease soldCount for cancelled order ${event.orderCode}`,
        error,
      );
    }
  }
}
