import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { OrderPaymentMethod, OrderStatus } from 'generated/prisma/enums';

import { CartsService } from '../carts/carts.service';
import { InventoryService } from '../inventory/inventory.service';
import { BookService } from '../book/book.service';
import { PromotionService } from '../promotion/promotion.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from 'src/strategies/jwt-payload.interface';
import { CreateOrderRequestDto } from './dto/create-order.request.dto';
import { OrderResponseDto } from './dto/order.response.dto';
import { OrdersRepository } from './orders.repository';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { PaginateOrderDto } from './dto/pagination-orders.dto';
import { VouchersService } from '../vouchers/vouchers.service';
import { AddressService } from '../address/address.service';
import { GhnService } from '../ghn/ghn.service';
import { GhnCalculateFeeRequestDto } from '../ghn/dto/calculate-fee.request.dto';

type OrderItemPayload = {
  bookId: string;
  bookTitle: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly addressService: AddressService,
    private readonly cartsService: CartsService,
    private readonly inventoryService: InventoryService,
    private readonly bookService: BookService,
    private readonly promotionService: PromotionService,
    private readonly vouchersService: VouchersService,
    private readonly ghnService: GhnService, // gọi này để tính phí ship
    private readonly prisma: PrismaService,
  ) {}

  // code ai hay nhưng sử lí phân luông chưa tốt, cần tối ưu lại phần này nên tách biệt hẳn repository để dễ quản lí transaction, tránh việc service phải gọi nhiều repository
  async createOrder(
    request: CreateOrderRequestDto,
    user: JwtUser,
  ): Promise<OrderResponseDto> {
    try {
      const cart = await this.cartsService.findUserCarts(user.userId);
      if (!cart.items.length) {
        throw new BadRequestException('Giỏ hàng đang trống');
      }

      // chỉ lấy những item có trong cardItemIds, nếu không có thì lấy tất cả
      const filteredItems = cart.items.filter((item) =>
        request.cardItemIds.includes(item.id),
      );

      if (!filteredItems.length) {
        throw new BadRequestException(
          'Không có item nào trong giỏ hàng phù hợp với yêu cầu',
        );
      }

      const activePromotions =
        await this.promotionService.getActivePromotions();

      const promotionLookup = new Map<string, number>();
      for (const promotion of activePromotions) {
        for (const bookId of promotion.bookIds ?? []) {
          const currentDiscount = promotionLookup.get(bookId) ?? 0;
          promotionLookup.set(
            bookId,
            Math.max(currentDiscount, promotion.discountRate),
          );
        }
      }

      const items: OrderItemPayload[] = [];
      let subtotalAmount = 0;
      let promotionDiscountAmount = 0;

      for (const cartItem of filteredItems) {
        const inventory = await this.inventoryService.findByBookId(
          cartItem.book.id,
        );
        if (!inventory) {
          throw new BadRequestException(
            `Sách ${cartItem.book.title} không tồn tại trong kho`,
          );
        }
        if (inventory.quantity < cartItem.quantity) {
          throw new BadRequestException(
            `Sách ${cartItem.book.title} không đủ hàng trong kho`,
          );
        }

        //lấy địa chỉ giao hàng

        const unitPrice = Number(cartItem.book.price);
        const itemSubtotal = unitPrice * cartItem.quantity;
        const itemDiscountRate = promotionLookup.get(cartItem.book.id) ?? 0;
        const itemDiscountAmount = Math.floor(
          (itemSubtotal * itemDiscountRate) / 100,
        );
        const itemTotalAmount = itemSubtotal - itemDiscountAmount;

        subtotalAmount += itemSubtotal;
        promotionDiscountAmount += itemDiscountAmount;
        items.push({
          bookId: cartItem.book.id,
          bookTitle: cartItem.book.title,
          quantity: cartItem.quantity,
          unitPrice,
          discountAmount: itemDiscountAmount,
          totalAmount: itemTotalAmount,
        });
      }

      const address = await this.addressService.findOneForUser(
        request.addressId,
        user.userId,
      );

      console.log('Địa chỉ giao hàng:', address);

      // 1. Tính trước voucher (nếu có) ở ngoài transaction
      let anticipatedVoucherDiscount = 0;
      if (request.voucherCode) {
        const amountForVoucher = Math.max(
          0,
          subtotalAmount - promotionDiscountAmount,
        );
        const { discountAmount } =
          await this.vouchersService.validateVoucherForOrder({
            code: request.voucherCode,
            orderAmount: amountForVoucher,
          });
        anticipatedVoucherDiscount = discountAmount;
      }

      const finalDiscountAmount =
        promotionDiscountAmount + anticipatedVoucherDiscount;

      const amountBeforeShipping = Math.max(
        0,
        subtotalAmount - finalDiscountAmount,
      );

      // 2. Tính phí ship
      // COD và "người nhận trả ship": GHN có thể tính thêm COD fee dựa trên cod_value.
      // Để ra phí chính xác và tránh vòng phụ thuộc, gọi GHN 2 lần:
      //  - Lần 1: cod_value = 0 => lấy ship cơ bản
      //  - Lần 2 (COD): cod_value = tiền hàng sau giảm + ship cơ bản => lấy ship cuối
      const baseCalculateFee: Omit<GhnCalculateFeeRequestDto, 'cod_value'> = {
        // sau này nếu sử dụng dịch vụ chính thức của GHN có thể sửa lại code vd như trở thành khách hàng thì giá sẽ đc có định
        to_district_id: address.district.DistrictID,
        to_ward_code: address.ward.WardCode,
        weight: items.reduce((sum, item) => sum + item.quantity * 300, 0),
        insurance_value: subtotalAmount - promotionDiscountAmount,
        height: 10,
        length: 10,
        width: 10,
      };

      // không tính phí ship ở đây nữa mà tính ở chỗ khác còn đây là tạo đơn luôn
      let shippingFeeObj = await this.ghnService.calculateShippingFee({
        ...baseCalculateFee,
        cod_value: 0,
      });
      let shippingFee = shippingFeeObj?.total ?? 0;

      if (request.paymentMethod === OrderPaymentMethod.COD) {
        const codValue = amountBeforeShipping + shippingFee;
        shippingFeeObj = await this.ghnService.calculateShippingFee({
          ...baseCalculateFee,
          cod_value: codValue,
        });
        shippingFee = shippingFeeObj?.total ?? 0;
      }

      console.log('Phí vận chuyển tính từ GHN:', shippingFeeObj);

      const orderCode = this.generateOrderCode();

      const createdOrder = await this.prisma.$transaction(async (tx) => {
        let voucherId: string | undefined;
        let voucherDiscountAmount = 0;

        if (request.voucherCode) {
          const amountForVoucher = Math.max(
            0,
            subtotalAmount - promotionDiscountAmount,
          );
          const voucherResult = await this.vouchersService.applyVoucherForOrder(
            tx,
            {
              code: request.voucherCode,
              orderAmount: amountForVoucher,
              userId: user.userId,
            },
          );
          voucherId = voucherResult.voucherId;
          voucherDiscountAmount = voucherResult.discountAmount;
        }

        const totalAmount = amountBeforeShipping + shippingFee;

        // Xoá logic vi phạm cross-module dependency: cartItems, book soldCount nên được xử lý bởi Repository
        // Nhưng tạm thời sửa theo ý user là "cod_value" trước.
        const order = await this.ordersRepository.create(tx, {
          code: orderCode,
          user: {
            connect: { id: user.userId },
          },
          status: OrderStatus.PENDING,
          paymentMethod: request.paymentMethod || OrderPaymentMethod.COD,
          subtotalAmount,
          discountAmount: finalDiscountAmount,
          shippingFee,
          totalAmount,
          shippingName: address.fullName,
          shippingPhone: address.phone,
          shippingAddress: address.addressLine,
          shippingWard: address.ward.WardName,
          shippingDistrict: address.district.DistrictName,
          shippingCity: address.province.ProvinceName,
          shippingCountry: address.country ?? 'Vietnam',
          note: request.note,
          voucher: voucherId ? { connect: { id: voucherId } } : undefined,
          items: {
            create: items.map((item) => ({
              bookId: item.bookId,
              bookTitle: item.bookTitle,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountAmount: item.discountAmount,
              totalAmount: item.totalAmount,
            })),
          },
        } as Prisma.OrderCreateInput);

        for (const item of items) {
          const updateStockCount =
            await this.inventoryService.decrementStockByTx(
              tx,
              item.bookId,
              item.quantity,
            );

          if (updateStockCount === 0) {
            throw new BadRequestException(
              `Sách ${item.bookTitle} vừa hết hàng`,
            );
          }

          // Trì hoãn việc update soldCount hoặc update qua BookService
          await this.bookService.updateSoldCountByTx(
            tx,
            item.bookId,
            item.quantity,
          );
        }

        await this.cartsService.deleteItemsByTx(
          tx,
          cart.id,
          request.cardItemIds,
        );

        return order;
      });

      return this.mapOrder(createdOrder);
    } catch (error) {
      this.logger.error('Lỗi khi tạo order', error);
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2002'
      ) {
        const target = (error as { meta?: unknown }).meta as
          | { target?: unknown }
          | undefined;
        const fields = target?.target;
        if (
          Array.isArray(fields) &&
          fields.includes('userId') &&
          fields.includes('voucherId')
        ) {
          throw new BadRequestException(
            'Mỗi voucher chỉ được sử dụng 1 lần/user',
          );
        }
      }

      throw new InternalServerErrorException('Không thể tạo đơn hàng');
    }
  }

  async getOrderById(id: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Không có quyền xem đơn hàng này');
    }

    return order;
  }

  async getByFilter(
    paginationQuery: PaginateOrderDto,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    //lấy tất cả đơn hàng, cái này phải filter
    return this.ordersRepository.findByFilter(paginationQuery);
  }

  async getMyOrders(
    userId: string,
    paginationQuery: PaginateOrderDto,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    delete paginationQuery.userId;
    return this.ordersRepository.findByFilter({ ...paginationQuery, userId });
  }

  private generateOrderCode(): string {
    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${Date.now()}-${randomSuffix}`;
  }

  private mapOrder(order: OrderResponseDto): OrderResponseDto {
    return order;
  }
}
