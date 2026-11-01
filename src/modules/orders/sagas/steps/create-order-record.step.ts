import { Injectable, Logger } from '@nestjs/common';
import { ISagaStep } from '../saga.interface';
import { CreateOrderSagaContext } from '../order-saga.context';
import { OrdersRepository } from '../../orders.repository';
import { OrderPaymentMethod, OrderStatus, Prisma } from 'generated/prisma/client';
import { OrderResponseDto } from '../../dto/order.response.dto';

@Injectable()
export class CreateOrderRecordStep
  implements ISagaStep<CreateOrderSagaContext>
{
  readonly name = 'CreateOrderRecordStep';
  private readonly logger = new Logger(CreateOrderRecordStep.name);

  constructor(private readonly ordersRepository: OrdersRepository) {}

  async execute(context: CreateOrderSagaContext): Promise<void> {
    const totalDiscount =
      context.promotionDiscountAmount + (context.voucherDiscountAmount || 0);
    const shippingFee = 0;
    const amountBeforeShipping = Math.max(
      0,
      context.subtotalAmount - totalDiscount,
    );
    const totalAmount = amountBeforeShipping + shippingFee;

    this.logger.log(
      `Saga Step [CreateOrderRecordStep]: Creating order record ${context.orderCode} with total ${totalAmount}`,
    );

    const orderData: Prisma.OrderCreateInput = {
      code: context.orderCode,
      user: { connect: { id: context.user.userId } },
      status: OrderStatus.PENDING,
      paymentMethod: context.request.paymentMethod || OrderPaymentMethod.COD,
      subtotalAmount: context.subtotalAmount,
      discountAmount: totalDiscount,
      shippingFee,
      totalAmount,
      returnRequestedAt: null,
      shippingName: context.address.fullName,
      shippingPhone: context.address.phone,
      shippingAddress: context.address.addressLine,
      shippingWard: context.address.ward.WardName,
      shippingWardCode: context.address.ward.WardCode,
      shippingDistrict: context.address.district.DistrictName,
      shippingDistrictId: context.address.district.DistrictID,
      shippingCity: context.address.province.ProvinceName,
      shippingCountry: context.address.country ?? 'Vietnam',
      note: context.request.note,
      voucher: context.voucherId
        ? { connect: { id: context.voucherId } }
        : undefined,
      items: {
        create: context.items.map((item) => ({
          bookId: item.bookId,
          bookTitle: item.bookTitle,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          totalAmount: item.totalAmount,
        })),
      },
    };

    const created = await this.ordersRepository.createOrder(orderData);
    context.createdOrder = created as unknown as OrderResponseDto;
  }

  async compensate(context: CreateOrderSagaContext): Promise<void> {
    if (context.createdOrder) {
      this.logger.warn(
        `Saga Compensating [CreateOrderRecordStep]: Cancelling order record ${context.createdOrder.id}`,
      );
      try {
        await this.ordersRepository.update(context.createdOrder.id, {
          status: OrderStatus.CANCELLED,
        });
      } catch (error) {
        this.logger.error(
          `Failed to cancel order record ${context.createdOrder.id} during saga compensation`,
          error,
        );
      }
    }
  }
}
