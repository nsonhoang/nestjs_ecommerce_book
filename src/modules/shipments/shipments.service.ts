import { Injectable, Logger } from '@nestjs/common';
import { ShipmentsRepository } from './shipments.repository';
import { ShipmentRequestDto } from './dto/shipments.request.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(private readonly shipmentsRepository: ShipmentsRepository) {}

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
