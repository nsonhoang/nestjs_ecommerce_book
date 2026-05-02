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

export type RequestWithUser = Request & { user: JwtUser };

@Controller('/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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
  async getOrders(
    @Query() paginationQuery: PaginateOrderDto,
  ): Promise<ApiResponse<PaginatedResult<OrderResponseDto>>> {
    const result = await this.ordersService.getByFilter(paginationQuery);
    return ApiResponse.ok(result, 'Lấy danh sách đơn hàng thành công');
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard) // cái này cũng phải filter
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

  //hủy đơn hàng dành cho khách hàng, đơn hàng ở trạng thái pending mới được hủy, khi hủy xong sẽ cộng lại số lượng vào inventory và gửi thông báo cho khách hàng
}
