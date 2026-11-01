import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ISagaStep } from './saga.interface';
import { CreateOrderSagaContext } from './order-saga.context';
import { ApplyVoucherStep } from './steps/apply-voucher.step';
import { ReserveInventoryStep } from './steps/reserve-inventory.step';
import { CreateOrderRecordStep } from './steps/create-order-record.step';
import { OrderResponseDto } from '../dto/order.response.dto';
import { OrderCreatedEvent } from '../events/order-created.event';

@Injectable()
export class OrderSagaOrchestrator {
  private readonly logger = new Logger(OrderSagaOrchestrator.name);

  constructor(
    private readonly applyVoucherStep: ApplyVoucherStep,
    private readonly reserveInventoryStep: ReserveInventoryStep,
    private readonly createOrderRecordStep: CreateOrderRecordStep,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(context: CreateOrderSagaContext): Promise<OrderResponseDto> {
    const steps: ISagaStep<CreateOrderSagaContext>[] = [
      this.applyVoucherStep,
      this.reserveInventoryStep,
      this.createOrderRecordStep,
    ];

    const executedSteps: ISagaStep<CreateOrderSagaContext>[] = [];

    this.logger.log(
      `Starting CreateOrderSaga for orderCode=${context.orderCode}, userId=${context.user.userId}`,
    );

    try {
      // 1. Tiến hành tuần tự các bước
      for (const step of steps) {
        this.logger.log(`Saga executing step: ${step.name}`);
        await step.execute(context);
        executedSteps.push(step);
      }

      const order = context.createdOrder!;
      this.logger.log(`Saga completed successfully for order ${order.code}`);

      // 2. Bắn domain event ra ngoài để Carts, Book soldCount, Notifications tự phản ứng
      this.eventEmitter.emit(
        OrderCreatedEvent.EVENT_NAME,
        new OrderCreatedEvent(
          order.id,
          order.code,
          context.user.userId,
          order.totalAmount,
          context.request.cardItemIds,
          context.items.map((i) => ({
            bookId: i.bookId,
            bookTitle: i.bookTitle,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        ),
      );

      return order;
    } catch (error) {
      // 3. Có sự cố -> Lập tức kích hoạt ngăn xếp bù trừ (LIFO rollback)
      this.logger.error(
        `CreateOrderSaga FAILED for orderCode=${context.orderCode}. Starting compensation...`,
        error,
      );
      await this.rollback(executedSteps, context);
      throw error;
    }
  }

  private async rollback(
    executedSteps: ISagaStep<CreateOrderSagaContext>[],
    context: CreateOrderSagaContext,
  ): Promise<void> {
    while (executedSteps.length > 0) {
      const step = executedSteps.pop()!;
      try {
        this.logger.warn(`Compensating step: ${step.name}`);
        await step.compensate(context);
      } catch (compensateError) {
        this.logger.error(
          `CRITICAL: Failed to compensate step ${step.name} for order ${context.orderCode}`,
          compensateError,
        );
      }
    }
  }
}
