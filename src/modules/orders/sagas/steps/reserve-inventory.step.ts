import { Injectable, Logger } from '@nestjs/common';
import { ISagaStep } from '../saga.interface';
import { CreateOrderSagaContext } from '../order-saga.context';
import { InventoryService } from 'src/modules/inventory';

@Injectable()
export class ReserveInventoryStep implements ISagaStep<CreateOrderSagaContext> {
  readonly name = 'ReserveInventoryStep';
  private readonly logger = new Logger(ReserveInventoryStep.name);

  constructor(private readonly inventoryService: InventoryService) {}

  async execute(context: CreateOrderSagaContext): Promise<void> {
    const itemsToReserve = context.items.map((i) => ({
      bookId: i.bookId,
      quantity: i.quantity,
    }));

    this.logger.log(
      `Saga Step [ReserveInventoryStep]: Reserving inventory for ${itemsToReserve.length} items on order ${context.orderCode}`,
    );

    await this.inventoryService.reserveStock(
      itemsToReserve,
      context.user.userId,
      `Xuất kho cho đơn hàng ${context.orderCode}`,
    );

    context.reservedItems = itemsToReserve;
  }

  async compensate(context: CreateOrderSagaContext): Promise<void> {
    if (context.reservedItems && context.reservedItems.length > 0) {
      this.logger.warn(
        `Saga Compensating [ReserveInventoryStep]: Restoring inventory for ${context.reservedItems.length} items on order ${context.orderCode}`,
      );
      try {
        await this.inventoryService.releaseStock(
          context.reservedItems,
          context.user.userId,
          `Hoàn kho do hủy tạo đơn hàng ${context.orderCode}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to release inventory during saga compensation for order ${context.orderCode}`,
          error,
        );
      }
    }
  }
}
