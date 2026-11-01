import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { OrderCreatedEvent } from '../../orders/events/order-created.event';
import { OrderStatusUpdatedEvent } from '../../orders/events/order-status-updated.event';
import { OrderCancelledEvent } from '../../orders/events/order-cancelled.event';

@Injectable()
export class NotificationsOrderEventListener {
  private readonly logger = new Logger(NotificationsOrderEventListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(OrderCreatedEvent.EVENT_NAME)
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      await this.notificationsService.sendNotificationToUser(
        event.userId,
        'Đặt hàng thành công',
        `Đơn hàng #${event.orderCode} đã được tạo thành công với tổng giá trị ${event.totalAmount.toLocaleString('vi-VN')} đ.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order created notification for ${event.orderCode}`,
        error,
      );
    }
  }

  @OnEvent(OrderStatusUpdatedEvent.EVENT_NAME)
  async handleStatusUpdated(event: OrderStatusUpdatedEvent): Promise<void> {
    try {
      const message =
        event.extraMessage ||
        `Đơn hàng #${event.orderCode} của bạn đã được cập nhật trạng thái: ${event.status}.`;
      await this.notificationsService.sendNotificationToUser(
        event.userId,
        'Cập nhật đơn hàng',
        message,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send status update notification for ${event.orderCode}`,
        error,
      );
    }
  }

  @OnEvent(OrderCancelledEvent.EVENT_NAME)
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    try {
      const reasonText = event.reason ? ` Lý do: ${event.reason}` : '';
      await this.notificationsService.sendNotificationToUser(
        event.userId,
        'Đơn hàng đã bị hủy',
        `Đơn hàng #${event.orderCode} của bạn đã được hủy thành công.${reasonText}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order cancelled notification for ${event.orderCode}`,
        error,
      );
    }
  }
}
