import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import {
  CartItemRequestDto,
  DeleteCartItemRequestDto,
  UpdateCartItemWithUserId,
} from './dto/cart.request.dto';
import { CartItemResponseDto, CartResponseDto } from './dto/cart.response.dto';
import { CartRepository } from './carts.repository';
import { JwtUser } from 'src/strategies/jwt-payload.interface';
import { UpdateCartItemDto } from './dto/update-cart.dto';

@Injectable()
export class CartsService {
  private readonly logger = new Logger(CartsService.name);

  constructor(private readonly cartRepository: CartRepository) {}
  // create(createCartDto: CreateCartDto) {
  //   return 'This action adds a new cart';
  // }
  async addItemToCart(
    cartItemDto: CartItemRequestDto,
    tokenUser: JwtUser,
  ): Promise<CartItemResponseDto> {
    // if(!tokenUser) {
    //   throw new UnauthorizedException('Unauthorized');
    // }
    try {
      const cartItemData: UpdateCartItemWithUserId = {
        userId: tokenUser.userId,
        ...cartItemDto,
      };
      const newItem = await this.cartRepository.addItemToCart(cartItemData);
      return newItem;
    } catch (error) {
      this.logger.error('Error adding item to cart', error);
      throw error;
    }
  }

  findAll() {
    return `This action returns all carts`;
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} cart`;
  // }

  async findUserCarts(userId: string): Promise<CartResponseDto> {
    const carts = await this.cartRepository.findUserCarts(userId);
    return carts;
  }
  updateItem(
    updateCartDto: UpdateCartItemDto,
    itemId: string,
    userId: string,
  ): Promise<CartItemResponseDto> {
    try {
      return this.cartRepository.updateItem(updateCartDto, itemId, userId);
    } catch (error) {
      this.logger.error('Error updating cart item', error);
      throw error;
    }
  }

  async removeCartItem(idItem: string, userId: string): Promise<void> {
    await this.cartRepository.removeCartItem(idItem, userId);
  }

  async removeManyCartItems(
    itemIds: DeleteCartItemRequestDto,
    userId: string,
  ): Promise<number> {
    const result = await this.cartRepository.deleteMany(itemIds, userId);
    console.log('Result of deleteMany:', result);
    if (result === 0) {
      this.logger.error('Error deleting multiple cart items');
      throw new BadRequestException(
        'Xóa không thành công, item đó có thể không có trong giỏ hàng',
      );
    }
    if (result < itemIds.cartItemid.length) {
      this.logger.warn(
        `Một số item không được xóa vì không tồn tại hoặc không thuộc về user. Requested: ${itemIds.cartItemid.length}, Deleted: ${result}`,
      );
    }
    return result;
  }
}
