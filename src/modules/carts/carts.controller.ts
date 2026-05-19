import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { minutes, Throttle } from '@nestjs/throttler';
import { CartsService } from './carts.service';

import {
  CartItemRequestDto,
  DeleteCartItemRequestDto,
} from './dto/cart.request.dto';
import { type RequestWithUser } from '../users/user.controller';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { ApiResponse } from 'src/common/api-response';
import { CartItemResponseDto, CartResponseDto } from './dto/cart.response.dto';
import { UpdateCartItemDto } from './dto/update-cart.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Carts')
@ApiBearerAuth()
@Controller('/v1/carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  //Phương thức này sẽ thêm cartItem luôn
  @ApiOperation({ summary: 'Thêm item vào giỏ hàng' })
  @ApiBody({ type: CartItemRequestDto })
  @ApiOkResponse({ description: 'Thêm item thành công' })
  @Post('/items')
  @UseGuards(JwtAuthGuard) // Bảo vệ endpoint này bằng JWT Auth Guard
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async addItemToCart(
    @Body() cartItemDto: CartItemRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<CartItemResponseDto>> {
    const result = await this.cartsService.addItemToCart(cartItemDto, req.user);
    return ApiResponse.ok(result, 'Thêm vào giỏ hàng thành công');
  }

  @ApiOperation({ summary: 'Lấy giỏ hàng của tôi' })
  @ApiOkResponse({ description: 'Lấy giỏ hàng thành công' })
  @Get('/user')
  @UseGuards(JwtAuthGuard)
  async findUserCarts(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<CartResponseDto>> {
    const carts = await this.cartsService.findUserCarts(req.user.userId);
    return ApiResponse.ok(carts, 'Lấy giỏ hàng thành công');
  }

  //chính chủ mới cập sửa đc
  // itemId - bookID là unique
  @ApiOperation({ summary: 'Cập nhật item trong giỏ hàng' })
  @ApiParam({ name: 'id', description: 'Cart item id' })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiOkResponse({ description: 'Cập nhật item thành công' })
  @Patch('items/:id')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async updateItem(
    @Param('id', ParseUUIDPipe) itemId: string, // này để lấy id của item cần cập nhật
    @Req() req: RequestWithUser, // này để lấy userId từ token kiểm tra xem có phải chủ sở hữu của item này không
    @Body() updateCartDto: UpdateCartItemDto, // lấu số lượng mới để cập nhật
  ) {
    const result = await this.cartsService.updateItem(
      updateCartDto,
      itemId,
      req.user.userId,
    );
    return ApiResponse.ok(result, 'Cập nhật item trong giỏ hàng thành công');
  }

  // xóa item trong cart
  @ApiOperation({ summary: 'Xóa item khỏi giỏ hàng' })
  @ApiParam({ name: 'id', description: 'Cart item id' })
  @ApiOkResponse({ description: 'Xóa item thành công' })
  @Delete('items/:id')
  @UseGuards(JwtAuthGuard) // phải là chính chủ mới xóa đc
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async removeItem(
    @Param('id', ParseUUIDPipe) idItem: string,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<unknown>> {
    await this.cartsService.removeCartItem(idItem, req.user.userId);

    return ApiResponse.message('Xóa item khỏi giỏ hàng thành công', 200);
  }
  @ApiOperation({ summary: 'Xóa nhiều item khỏi giỏ hàng' })
  @ApiBody({ type: DeleteCartItemRequestDto })
  @ApiOkResponse({ description: 'Xóa nhiều item thành công' })
  @Delete('items')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async deleteMany(
    @Req() req: RequestWithUser,
    @Body() body: DeleteCartItemRequestDto,
  ): Promise<ApiResponse<unknown>> {
    // Implementation for deleting multiple items
    const result = await this.cartsService.removeManyCartItems(
      body,
      req.user.userId,
    );
    return ApiResponse.message(`Đã xóa ${result} item khỏi giỏ hàng`, 200);
  }

  //phương thức get count

  @ApiOperation({ summary: 'Lấy số lượng item trong giỏ hàng' })
  @ApiOkResponse({ description: 'Lấy số lượng item thành công' })
  @Get('/count')
  @UseGuards(JwtAuthGuard)
  async getCartCount(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<number>> {
    const count = await this.cartsService.getCartCount(req.user.userId);
    return ApiResponse.ok(count, 'Lấy số lượng item trong giỏ hàng thành công');
  }
}
