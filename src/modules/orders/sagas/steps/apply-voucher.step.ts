import { Injectable, Logger } from '@nestjs/common';
import { ISagaStep } from '../saga.interface';
import { CreateOrderSagaContext } from '../order-saga.context';
import { VouchersService } from 'src/modules/vouchers';

@Injectable()
export class ApplyVoucherStep implements ISagaStep<CreateOrderSagaContext> {
  readonly name = 'ApplyVoucherStep';
  private readonly logger = new Logger(ApplyVoucherStep.name);

  constructor(private readonly vouchersService: VouchersService) {}

  async execute(context: CreateOrderSagaContext): Promise<void> {
    if (!context.request.voucherCode) {
      context.voucherDiscountAmount = 0;
      return;
    }

    const amountForVoucher = Math.max(
      0,
      context.subtotalAmount - context.promotionDiscountAmount,
    );

    this.logger.log(
      `Saga Step [ApplyVoucherStep]: Applying voucher ${context.request.voucherCode} for order ${context.orderCode}`,
    );

    const result = await this.vouchersService.applyVoucher({
      code: context.request.voucherCode,
      orderAmount: amountForVoucher,
      userId: context.user.userId,
    });

    context.voucherId = result.voucherId;
    context.voucherDiscountAmount = result.discountAmount;
  }

  async compensate(context: CreateOrderSagaContext): Promise<void> {
    if (context.voucherId) {
      this.logger.warn(
        `Saga Compensating [ApplyVoucherStep]: Releasing voucher ${context.voucherId} for order ${context.orderCode}`,
      );
      try {
        await this.vouchersService.releaseVoucher(context.voucherId);
      } catch (error) {
        this.logger.error(
          `Failed to release voucher ${context.voucherId} during saga compensation`,
          error,
        );
      }
    }
  }
}
