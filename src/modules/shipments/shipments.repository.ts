import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentRequestDto } from './dto/shipments.request.dto';

@Injectable()
export class ShipmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // tạo đơn hàng khi hang khi đơn người bán nhấn xác nhận đơn hàng chuyển sang trạng thái processing,
  // khi đó sẽ tạo đơn hàng vận chuyển trong bảng shipment,
  // trạng thái ban đầu sẽ là pending,
  // sau đó khi ghn gửi web hook về thì sẽ cập nhật trạng thái đơn hàng vận chuyển tương ứng
  async createShipment(
    shipmentData: ShipmentRequestDto,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.shipment.create({ data: shipmentData });
  }

  async findByOrderId(orderId: string) {
    return this.prisma.shipment.findUnique({ where: { orderId } });
  }

  async findByGhnCode(ghnCode: string) {
    return this.prisma.shipment.findUnique({
      where: { ghnOrderCode: ghnCode },
    });
  }

  async findById(shipmentId: string) {
    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }

  async getAllShipments() {
    // cái này sẽ này sẽ filter phân trang theo orderId, userId,trạng thái đơn hàng , ngày giao hàng, nhưng để test thì sẽ lấy tất cả đơn hàng trước
    return this.prisma.shipment.findMany();
  }

  async updateShipmentStatus(shipmentId: string, status: string) {
    // cập nhật trạng thái đơn hàng
    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status },
    });
  }

  async updateByGhnCode(
    ghnCode: string,
    data: Prisma.ShipmentUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    await client.shipment.update({
      where: { ghnOrderCode: ghnCode },
      data,
    });
  }
}
