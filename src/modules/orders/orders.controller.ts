import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { type Request } from 'express';
import { minutes, Throttle } from '@nestjs/throttler';

import { ApiResponse } from 'src/common/api-response';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { type JwtUser } from 'src/strategies/jwt-payload.interface';
import { CreateOrderRequestDto } from './dto/create-order.request.dto';
import { OrderResponseDto } from './dto/order.response.dto';
import { OrdersService } from './orders.service';
import { PaginateOrderDto } from './dto/pagination-orders.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { UpdateOrderStatusRequestDto } from './dto/update-order-status.request.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from '../roles/roles.enum';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

export type RequestWithUser = Request & { user: JwtUser };

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Tạo đơn hàng' })
  @ApiBody({ type: CreateOrderRequestDto })
  @ApiOkResponse({ description: 'Tạo đơn hàng thành công' })
  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async createOrder(
    @Body() request: CreateOrderRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.ordersService.createOrder(request, req.user);
    return ApiResponse.ok(order, 'Tạo đơn hàng thành công');
  }

  @Get() //lấy tất cả đơn hàng, cái này phải filter
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng (admin/staff)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentMethod', required: false })
  @ApiOkResponse({ description: 'Lấy danh sách đơn hàng thành công' })
  async getOrders(
    @Query() paginationQuery: PaginateOrderDto,
  ): Promise<ApiResponse<PaginatedResult<OrderResponseDto>>> {
    const result = await this.ordersService.getByFilter(paginationQuery);
    return ApiResponse.ok(result, 'Lấy danh sách đơn hàng thành công');
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard) // cái này cũng phải filter
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của tôi' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiOkResponse({ description: 'Lấy danh sách đơn hàng thành công' })
  async getMyOrders(
    @Req() req: RequestWithUser,
    @Query() paginationQuery: PaginateOrderDto,
  ): Promise<ApiResponse<PaginatedResult<OrderResponseDto>>> {
    const orders = await this.ordersService.getMyOrders(
      req.user.userId,
      paginationQuery,
    );

    return ApiResponse.ok(orders, 'Lấy danh sách đơn hàng thành công');
  }

  // chỉ được xem đơn hàng của mình thôi, admin mới dc xem tất cả
  @Get('/me/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng của tôi' })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiOkResponse({ description: 'Lấy chi tiết đơn hàng thành công' })
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.ordersService.getOrderById(id, req.user.userId);
    return ApiResponse.ok(order, 'Lấy chi tiết đơn hàng thành công');
  }

  //còn 1 hàm là update status nữa
  // cập nhật đơn hàng xong sẽ bắn notification cho khách hàng, cái này sẽ được gọi bởi admin khi xác nhận đơn hàng, hoặc khi giao hàng
  @Patch('/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng (admin/staff)' })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiBody({ type: UpdateOrderStatusRequestDto })
  @ApiOkResponse({ description: 'Cập nhật trạng thái đơn hàng thành công' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateOrderStatusRequestDto,
  ): Promise<ApiResponse<OrderResponseDto>> {
    // NOTE: Endpoint này dành cho người bán/admin xác nhận đơn.
    // endpoint chỉ nên dùng để cập nhật trạng thái đơn hàng sang PROCESSING, sau đó khi ghn gửi web hook về thì sẽ cập nhật trạng thái đơn hàng vận chuyển tương ứng
    // Khi chuyển sang PROCESSING, OrdersService sẽ tạo đơn GHN + Shipment record.
    const order = await this.ordersService.updateOrderStatus(id, body.status);
    return ApiResponse.ok(order, 'Cập nhật trạng thái đơn hàng thành công');
  }

  @Patch('/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  @ApiOperation({ summary: 'Hủy đơn hàng (admin/staff)' })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiOkResponse({ description: 'Hủy đơn hàng thành công' })
  async cancelOrderByAdmin(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.ordersService.cancelOrderByAdmin(id);
    return ApiResponse.ok(order, 'Hủy đơn hàng thành công');
  }

  @Patch('/me/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  @ApiOperation({ summary: 'Hủy đơn hàng của tôi' })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiOkResponse({ description: 'Hủy đơn hàng thành công' })
  async cancelOrderByUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.ordersService.cancelOrderByUser(
      id,
      req.user.userId,
    );
    return ApiResponse.ok(order, 'Hủy đơn hàng thành công');
  }

  @Patch('/me/:id/return')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  @ApiOperation({ summary: 'Yêu cầu trả hàng' })
  @ApiParam({ name: 'id', description: 'Order id' })
  @ApiOkResponse({ description: 'Yêu cầu trả hàng thành công' })
  async requestReturnOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<OrderResponseDto>> {
    const order = await this.ordersService.requestReturnOrder(
      id,
      req.user.userId,
    );
    return ApiResponse.ok(order, 'Yêu cầu trả hàng thành công');
  }
}
