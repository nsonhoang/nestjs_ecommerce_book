import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DeleteCartItemRequestDto,
  UpdateCartItemWithUserId,
} from './dto/cart.request.dto';

import { CartItemResponseDto, CartResponseDto } from './dto/cart.response.dto';
import { UpdateCartItemDto } from './dto/update-cart.dto';

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addItemToCart(
    cartItemDto: UpdateCartItemWithUserId,
  ): Promise<CartItemResponseDto> {
    const { userId, bookId, quantity } = cartItemDto;

    // Tìm hoặc tạo cart cho user
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
          items: { create: [] }, // Tạo một cart rỗng
        },
      });
    }

    // Thêm item vào cart
    const newItem = await this.prisma.cartItem.upsert({
      where: {
        cartId_bookId: {
          cartId: cart.id,
          bookId, //khoong phai truyen bookID khong vao maf truyền cẩ giá khuyễn mãi vào tránh việc có khuyên mãi mà giá vẫn không thay đổi
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        cartId: cart.id,
        bookId,
        quantity,
      },
      select: {
        id: true,
        cartId: true,
        book: {
          select: {
            id: true,
            title: true,
            price: true,
            thumbnail: true,
          },
        },
        quantity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return newItem;
  }

  async findUserCarts(userId: string): Promise<CartResponseDto> {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          select: {
            id: true,
            cartId: true,
            book: {
              select: {
                id: true,
                title: true,
                price: true,
                thumbnail: true,
              },
            },
            quantity: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!cart) {
      // Tự động "bù" một cái giỏ hàng mới tinh ngay lập tức
      cart = await this.prisma.cart.create({
        data: {
          userId,
          items: { create: [] }, // Tạo một cart rỗng
        },
        include: {
          items: {
            select: {
              id: true,
              cartId: true,
              book: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  thumbnail: true,
                },
              },
              quantity: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    }
    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items.map((item) => ({
        id: item.id,
        cartId: item.cartId,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        book: {
          id: item.book.id,
          title: item.book.title,
          thumbnail: item.book.thumbnail,
          price: item.book.price, // nếu DTO book.price là string
        },
      })),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async removeCartItem(idItem: string, userId: string) {
    return this.prisma.cartItem
      .delete({
        where: {
          id: idItem,
          cart: {
            userId,
          },
        },
      })
      .then(() => {});
  }

  async deleteMany(
    item: DeleteCartItemRequestDto,
    userId: string,
  ): Promise<number> {
    const result = await this.prisma.cartItem.deleteMany({
      where: {
        id: { in: item.cartItemid },
        cart: {
          userId,
        },
      },
    });
    return result.count;
  }

  async clearCart(userId: string): Promise<number> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      return 0;
    }

    const result = await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return result.count;
  }

  async getCartCount(userId: string): Promise<number> {
    return await this.prisma.cartItem.count({
      where: {
        cart: {
          userId,
        },
      },
    });
  }

  // Cập nhật số lượng item trong cart
  async updateItem(
    updateCartDto: UpdateCartItemDto,
    itemId: string,
    userId: string,
  ): Promise<CartItemResponseDto> {
    const { quantity } = updateCartDto;
    // Kiểm tra xem item có tồn tại và thuộc về user không
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
        },
      },
    });
    if (!existingItem) {
      throw new Error('Item not found or not owned by user');
    }
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      select: {
        id: true,
        cartId: true,
        book: {
          select: {
            id: true,
            title: true,
            price: true,
            thumbnail: true,
          },
        },
        quantity: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
