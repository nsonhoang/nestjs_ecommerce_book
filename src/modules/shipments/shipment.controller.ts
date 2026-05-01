import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiResponse } from 'src/common/api-response';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { ShipmentsService } from './shipments.service';
import { PaginateShipmentsDto } from './dto/paginate-shipments.dto';
import { Prisma } from 'generated/prisma/client';

type ShipmentWithOrder = Prisma.ShipmentGetPayload<{
  include: { order: true };
}>;

@Controller('/v1/shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  // chỉ cần phương thức getAllShipments để test, các phương thức còn update sẽ không có mà chi tạo trong service
  // khi nào ghn gửi web hook thì sẽ tự động cập nhật trạng thái đơn hàng, nên sẽ không cần phương thức update trong controller nữa
  @Get()
  async getAllShipments(
    @Query() query: PaginateShipmentsDto,
  ): Promise<ApiResponse<PaginatedResult<ShipmentWithOrder>>> {
    const shipments = await this.shipmentsService.getAllShipments(query);
    return ApiResponse.ok(shipments, 'Lấy danh sách shipment thành công');
  }

  @Get('/order/:orderId')
  async getShipmentByOrderId(@Param('orderId') orderId: string) {
    return this.shipmentsService.getShipmentByOrderId(orderId);
  }

  @Get('/:id')
  async getShipmentById(@Param('id') id: string) {
    return this.shipmentsService.getShipmentById(id);
  }
}
