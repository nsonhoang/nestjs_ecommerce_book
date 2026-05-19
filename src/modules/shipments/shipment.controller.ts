import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiResponse } from 'src/common/api-response';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { ShipmentsService } from './shipments.service';
import { PaginateShipmentsDto } from './dto/paginate-shipments.dto';
import { Prisma } from 'generated/prisma/client';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from '../roles/roles.enum';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

type ShipmentWithOrder = Prisma.ShipmentGetPayload<{
  include: { order: true };
}>;

@ApiTags('Shipments')
@ApiBearerAuth()
@Controller('/v1/shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  // chỉ cần phương thức getAllShipments để test, các phương thức còn update sẽ không có mà chi tạo trong service
  // khi nào ghn gửi web hook thì sẽ tự động cập nhật trạng thái đơn hàng, nên sẽ không cần phương thức update trong controller nữa
  @ApiOperation({ summary: 'Lấy danh sách shipment (admin/staff)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ description: 'Lấy danh sách shipment thành công' })
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async getAllShipments(
    @Query() query: PaginateShipmentsDto,
  ): Promise<ApiResponse<PaginatedResult<ShipmentWithOrder>>> {
    const shipments = await this.shipmentsService.getAllShipments(query);
    return ApiResponse.ok(shipments, 'Lấy danh sách shipment thành công');
  }

  @ApiOperation({ summary: 'Lấy shipment theo orderId (admin/staff)' })
  @ApiParam({ name: 'orderId', description: 'Order id' })
  @ApiOkResponse({ description: 'Lấy shipment theo orderId thành công' })
  @Get('/order/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async getShipmentByOrderId(@Param('orderId') orderId: string) {
    return this.shipmentsService.getShipmentByOrderId(orderId);
  }

  @ApiOperation({ summary: 'Lấy shipment theo id (admin/staff)' })
  @ApiParam({ name: 'id', description: 'Shipment id' })
  @ApiOkResponse({ description: 'Lấy shipment theo id thành công' })
  @Get('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async getShipmentById(@Param('id') id: string) {
    return this.shipmentsService.getShipmentById(id);
  }
}
