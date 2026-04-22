import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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

  async updateStatus() {
    // nếu ở pending thì có thể hủy đơn hàng
    // có thể hủy đơn hàng nếu đang ở trạng thái PENDING ,còn ở trạng thái PROCESSING thì không ,
    //  nếu có module shipment khi orderId này cí liên quan đến shipment rồi thì trạng thái đơn hàng
    // sẽ chuyển sang shipping (cái này có thể xử lí bên module shipment luôn cũng được)
    // đã giao hàng sẽ đc cập thông qua shipment luôn , người dùng sau đó có thể returning hàng , sau đó admin sẽ xác nhận REFUNDED
  }

  //update status for admin, còn user thì chỉ đc hủy đơn hàng khi đang ở trạng thái pending thôi, còn lại là ko đc phép update status
}
