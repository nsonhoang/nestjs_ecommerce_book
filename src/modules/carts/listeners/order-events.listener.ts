import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CartsService } from '../carts.service';
import { OrderCreatedEvent } from '../../orders/events/order-created.event';

@Injectable()
export class CartsOrderEventListener {
  private readonly logger = new Logger(CartsOrderEventListener.name);

  constructor(private readonly cartsService: CartsService) {}

  @OnEvent(OrderCreatedEvent.EVENT_NAME)
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      if (event.cartItemIds && event.cartItemIds.length > 0) {
        this.logger.log(
          `Cleaning up ${event.cartItemIds.length} purchased items from cart for user ${event.userId}`,
        );
        await this.cartsService.removeManyCartItems(
          { cartItemid: event.cartItemIds },
          event.userId,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to clear cart items for user ${event.userId} on order ${event.orderCode}`,
        error,
      );
    }
  }
}
