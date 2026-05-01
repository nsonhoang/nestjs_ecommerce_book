import { Injectable, Logger } from '@nestjs/common';
import { ShipmentsRepository } from './shipments.repository';
import { ShipmentRequestDto } from './dto/shipments.request.dto';
import { OrderStatus, Prisma } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(
    private readonly shipmentsRepository: ShipmentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  private mapGhnShipmentStatusToOrderStatus(
    status: string,
  ): OrderStatus | null {
    const normalized = status.trim().toLowerCase();

    // PROCESSING-ish
    if (
      [
        'ready_to_pick',
        'picking',
        'picked',
        'storing',
        'waiting_to_pick',
      ].includes(normalized)
    ) {
      return OrderStatus.PROCESSING;
    }

    // SHIPPED-ish
    if (
      [
        'transporting',
        'sorting',
        'delivering',
        'money_collect_delivering',
      ].includes(normalized)
    ) {
      return OrderStatus.SHIPPED;
    }

    if (['delivered'].includes(normalized)) {
      return OrderStatus.DELIVERED;
    }

    if (['cancel', 'cancelled', 'canceled'].includes(normalized)) {
      return OrderStatus.CANCELLED;
    }

    if (['return', 'returning', 'returned'].includes(normalized)) {
      return OrderStatus.RETURNING;
    }

    return null;
  }

  async handleGhnWebhook(input: {
    orderCode: string;
    status: string;
    raw?: Record<string, unknown>;
  }): Promise<boolean> {
    try {
      const shipment = await this.shipmentsRepository.findByGhnCode(
        input.orderCode,
      );

      if (!shipment) {
        this.logger.warn(
          `GHN webhook: shipment not found for ghnOrderCode=${input.orderCode}`,
        );
        return false;
      }

      const nextOrderStatus = this.mapGhnShipmentStatusToOrderStatus(
        input.status,
      );

      const now = new Date();

      await this.prisma.$transaction(async (tx) => {
        // Update shipment status (always)
        await this.shipmentsRepository.updateByGhnCode(
          input.orderCode,
          {
            status: input.status,
            shippedAt:
              nextOrderStatus === OrderStatus.SHIPPED
                ? (shipment.shippedAt ?? now)
                : undefined,
            deliveredAt:
              nextOrderStatus === OrderStatus.DELIVERED
                ? (shipment.deliveredAt ?? now)
                : undefined,
          },
          tx,
        );

        // Update order status only when mapping is known
        if (nextOrderStatus) {
          await tx.order.update({
            where: { id: shipment.orderId },
            data: { status: nextOrderStatus },
          });
        }
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to handle GHN webhook', error);
      throw error;
    }
  }

  async createShipment(
    shipmentData: ShipmentRequestDto,
    tx?: Prisma.TransactionClient,
  ) {
    try {
      return await this.shipmentsRepository.createShipment(shipmentData, tx);
    } catch (error) {
      this.logger.error('Failed to create shipment', error);
      throw error;
    }
  }

  async getAllShipments() {
    try {
      return await this.shipmentsRepository.getAllShipments();
    } catch (error) {
      this.logger.error('Failed to get all shipments', error);
      throw error;
    }
  }

  async getShipmentById(shipmentId: string) {
    try {
      return await this.shipmentsRepository.findById(shipmentId);
    } catch (error) {
      this.logger.error(`Failed to get shipment by ID ${shipmentId}`, error);
      throw error;
    }
  }

  async getShipmentByOrderId(orderId: string) {
    try {
      return await this.shipmentsRepository.findByOrderId(orderId);
    } catch (error) {
      this.logger.error(`Failed to get shipment by order ID ${orderId}`, error);
      throw error;
    }
  }

  async updateShipmentStatus(shipmentId: string, status: string) {
    try {
      // Cập nhật trạng thái đơn hàng trong cơ sở dữ liệu
      await this.shipmentsRepository.updateShipmentStatus(shipmentId, status);
    } catch (error) {
      this.logger.error(
        `Failed to update shipment status for shipment ID ${shipmentId}`,
        error,
      );
      throw error;
    }
  }
}
