import {
  BadRequestException,
  ForbiddenException,
  HttpException,
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
import { IGhnCreateOrderRequest } from '../ghn/ghn.interface';

import { ShipmentsService } from '../shipments/shipments.service';
import { CartItemResponseDto } from '../carts/dto/cart.response.dto';
import { NotificationsService } from '../notifications/notifications.service';

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
  private readonly returnWindowMs = 7 * 24 * 60 * 60 * 1000;

  private buildTotalWeight(items: OrderItemPayload[]): number {
    // Tạm tính 300g / quyển (có thể chuyển sang lấy từ Book/Inventory sau)
    return items.reduce((sum, item) => sum + item.quantity * 300, 0);
  }

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly addressService: AddressService,
    private readonly cartsService: CartsService,
    private readonly inventoryService: InventoryService,
    private readonly bookService: BookService,
    private readonly promotionService: PromotionService,
    private readonly vouchersService: VouchersService,
    private readonly ghnService: GhnService, // gọi này để tính phí ship
    private readonly shipmentsService: ShipmentsService,
    private readonly notificationsService: NotificationsService,
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

      // const itemsOrder: OrderItemPayload[] = [];

      const { items, subtotalAmount, promotionDiscountAmount } =
        await this.validateAndPrepareOrderItems(
          filteredItems,
          promotionLookup,
          // subtotalAmountValue,
          // promotionDiscountAmountValue,
        );

      const address = await this.addressService.findOneForUser(
        request.addressId,
        user.userId,
      );

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

        /// tách logic ra
        const discountAmountInTx =
          promotionDiscountAmount + voucherDiscountAmount;
        const amountBeforeShippingInTx = Math.max(
          0,
          subtotalAmount - discountAmountInTx,
        );

        // Tạo order trước (chưa tạo shipment/ship fee).
        // NOTE: Đơn GHN + Shipment record sẽ được tạo khi cập nhật status sang PROCESSING.
        const shippingFee = 0;
        const totalAmount = amountBeforeShippingInTx + shippingFee;

        // Xoá logic vi phạm cross-module dependency: cartItems, book soldCount nên được xử lý bởi Repository
        // Nhưng tạm thời sửa theo ý user là "cod_value" trước.
        const order = await this.ordersRepository.create(tx, {
          code: orderCode, // cái này để hỗ trợ tìm kiếm đơn hàng
          user: {
            connect: { id: user.userId },
          },
          status: OrderStatus.PENDING,
          paymentMethod: request.paymentMethod || OrderPaymentMethod.COD,
          subtotalAmount,
          discountAmount: discountAmountInTx,
          shippingFee,
          totalAmount,
          returnRequestedAt: null,
          shippingName: address.fullName,
          shippingPhone: address.phone,
          shippingAddress: address.addressLine,
          shippingWard: address.ward.WardName,
          shippingWardCode: address.ward.WardCode,
          shippingDistrict: address.district.DistrictName,
          shippingDistrictId: address.district.DistrictID,
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
            await this.inventoryService.decrementStockAndLogByTx(
              tx,
              item.bookId,
              item.quantity,
              user.userId,
              'Xuất kho khi tạo đơn hàng',
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

      // NOTE: Không tạo đơn GHN ở đây nữa.
      // Đơn GHN + record Shipment sẽ được tạo khi người bán/admin cập nhật trạng thái sang PROCESSING.
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

  async hasPurchasedBook(userId: string, bookId: string): Promise<boolean> {
    try {
      return await this.ordersRepository.hasPurchasedBook(userId, bookId);
    } catch (error) {
      this.logger.error('Failed to check purchased book', error);
      throw new InternalServerErrorException('Failed to check purchased book');
    }
  }

  async getOrderById(id: string, userId: string): Promise<OrderResponseDto> {
    try {
      const order = await this.ordersRepository.findById(id);
      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }
      if (order.userId !== userId) {
        throw new ForbiddenException('Không có quyền xem đơn hàng này');
      }

      return order;
    } catch (error) {
      this.logger.error(`Failed to get order ${id}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get order ${id}`);
    }
  }

  async getByFilter(
    paginationQuery: PaginateOrderDto,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    try {
      return await this.ordersRepository.findByFilter(paginationQuery);
    } catch (error) {
      this.logger.error('Failed to get orders by filter', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get orders by filter');
    }
  }

  async getMyOrders(
    userId: string,
    paginationQuery: PaginateOrderDto,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    try {
      delete paginationQuery.userId;
      return await this.ordersRepository.findByFilter({ ...paginationQuery, userId });
    } catch (error) {
      this.logger.error(`Failed to get orders for user ${userId}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to get orders for user ${userId}`);
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderResponseDto> {
    try {
      const order = await this.ordersRepository.findById(orderId);
      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }
      // bắn thông báo cho khách hàng khi có sự thay đổi trạng thái đơn hàng, cái này sẽ được gọi bởi admin khi xác nhận đơn hàng, hoặc khi giao hàng
      // Chỉ tạo shipment khi chuyển sang PROCESSING (người bán/admin xác nhận đơn)và chỉ update processing đc thôi
      // còn trạng thái khác sẽ đc cập nhật thông qua webhook của GHN, tránh việc admin có thể tự ý chuyển trạng thái giao hàng khi chưa tạo đơn GHN, hoặc chuyển sang trạng thái khác ngoài quy trình xử lý đơn hàng thông thường. Ngoài ra việc tạo đơn GHN sẽ được thực hiện trong transaction khi cập nhật sang PROCESSING để đảm bảo tính nhất quán dữ liệu giữa đơn hàng và shipment.

      const returnedStatus = 'RETURNED' as OrderStatus;

      if (status !== OrderStatus.PROCESSING) {
        if (status === returnedStatus) {
          if (order.status !== OrderStatus.RETURNING) {
            throw new BadRequestException(
              'Chỉ có thể chuyển sang RETURNED khi đơn đang ở trạng thái RETURNING',
            );
          }

          const result = await this.prisma.$transaction(async (tx) => {
            for (const item of order.items) {
              const restoredInventoryCount =
                await this.inventoryService.increaseStockAndLogByTx(
                  tx,
                  item.bookId,
                  item.quantity,
                  undefined,
                  'Nhập kho do hàng trả về',
                );

              if (restoredInventoryCount === 0) {
                throw new BadRequestException(
                  `Không thể hoàn kho cho sách ${item.bookTitle}`,
                );
              }
            }

            return await this.ordersRepository.updateByTx(tx, orderId, {
              status: returnedStatus,
              returnRequestedAt: null,
            });
          });

          await this.notificationsService.sendNotificationToUser(
            order.userId,
            'Đơn hàng đã được xác nhận trả về',
            `Đơn hàng ${order.code} đã được xác nhận trả về và nhập lại kho.`,
          );

          return this.mapOrder(result);
        }

        // If admin uses generic status endpoint to set CANCELLED, delegate to cancelOrder
        if (status === OrderStatus.CANCELLED) {
          return this.cancelOrder(orderId);
        }

        const updatedOrder = await this.ordersRepository.update(orderId, {
          status,
        });
        return this.mapOrder(updatedOrder);
      }

      // Idempotent: nếu đã có shipment thì chỉ update status
      const existingShipment =
        await this.shipmentsService.getShipmentByOrderId(orderId);
      if (existingShipment) {
        const updatedOrder = await this.ordersRepository.update(orderId, {
          status,
        });
        return this.mapOrder(updatedOrder);
      }

      const amountBeforeShipping = Math.max(
        0,
        order.subtotalAmount - order.discountAmount,
      );

      if (!order.shippingWardCode || !order.shippingDistrictId) {
        throw new BadRequestException(
          'Thiếu shippingWardCode/shippingDistrictId để tạo đơn GHN. Vui lòng đặt lại đơn với địa chỉ hợp lệ.',
        );
      }

      const ghnCreatePayload: IGhnCreateOrderRequest = {
        payment_type_id: 2, // 2: Khách trả phí ship
        note: order.note ?? '',
        required_note: 'KHONGCHOXEMHANG',
        client_order_code: order.code,
        to_name: order.shippingName,
        to_phone: order.shippingPhone,
        to_address: order.shippingAddress,
        // Dùng snapshot GHN identifiers đã lưu ở Order lúc checkout
        to_ward_code: order.shippingWardCode,
        to_district_id: order.shippingDistrictId,
        cod_amount:
          order.paymentMethod === OrderPaymentMethod.COD
            ? amountBeforeShipping
            : 0,
        content: 'Book order',
        weight: this.buildTotalWeight(
          order.items.map((i) => ({
            bookId: i.bookId,
            bookTitle: i.bookTitle,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountAmount: i.discountAmount,
            totalAmount: i.totalAmount,
          })),
        ),
        length: 10,
        width: 10,
        height: 10,
        service_type_id: 2,
        insurance_value: amountBeforeShipping,
        items: order.items.map((item) => ({
          name: item.bookTitle,
          code: item.bookId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
      };

      // NOTE: Gọi GHN ở đây (khi chuyển PROCESSING) để tránh tạo shipment sớm.
      const ghnOrder =
        await this.ghnService.createShippingOrder(ghnCreatePayload);
      const shippingFee = Math.round(
        ghnOrder.total_fee ?? ghnOrder.fee?.total ?? 0,
      );
      const totalAmount = amountBeforeShipping + shippingFee;

      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        await this.shipmentsService.createShipment(
          {
            orderId: orderId,
            ghnOrderCode: ghnOrder.order_code,
            codAmount:
              order.paymentMethod === OrderPaymentMethod.COD
                ? amountBeforeShipping
                : 0,
            shippingFee,
            expectedDelivery: ghnOrder.expected_delivery_time
              ? new Date(ghnOrder.expected_delivery_time)
              : undefined,
          },
          tx,
        );

        return await this.ordersRepository.updateByTx(tx, orderId, {
          status: OrderStatus.PROCESSING,
          shippingFee,
          totalAmount,
        });
      });
      // nổ thống báo tại đây
      await this.notificationsService.sendNotificationToUser(
        order.userId,
        'Đơn hàng đã được cập nhật trạng thái',
        `Đơn hàng ${order.code} của bạn đã được cập nhật và đang được xử lý.Ngày giao dự kiến: ${ghnOrder.expected_delivery_time ? new Date(ghnOrder.expected_delivery_time).toLocaleDateString() : 'Đang cập nhật'}. Cảm ơn bạn đã mua hàng!`,
      ); // cái này là chi nổ khi admin cập nhật thôi chứ muốn trạng thái đổi liền phải thông qua webhook

      return this.mapOrder(updatedOrder);
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật trạng thái đơn hàng ${orderId}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Không thể cập nhật trạng thái đơn hàng');
    }
  }

  async cancelOrderByAdmin(orderId: string): Promise<OrderResponseDto> {
    return this.cancelOrder(orderId);
  }

  async cancelOrderByUser(
    orderId: string,
    userId: string,
  ): Promise<OrderResponseDto> {
    return this.cancelOrder(orderId, userId);
  }

  async requestReturnOrder(
    orderId: string,
    userId: string,
  ): Promise<OrderResponseDto> {
    try {
      const order = await this.ordersRepository.findById(orderId);
      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      if (order.userId !== userId) {
        throw new ForbiddenException('Không có quyền thao tác đơn hàng này');
      }

      if (order.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException(
          'Chỉ có thể yêu cầu trả hàng khi đơn đã được giao thành công',
        );
      }

      const deliveredAt = order.shipment?.deliveredAt;
      if (!deliveredAt) {
        throw new BadRequestException(
          'Không xác định được thời điểm giao hàng để yêu cầu trả hàng',
        );
      }

      const returnDeadline = deliveredAt.getTime() + this.returnWindowMs;
      if (Date.now() > returnDeadline) {
        throw new BadRequestException(
          'Đã quá hạn 7 ngày kể từ khi giao hàng, không thể yêu cầu trả hàng',
        );
      }

      const updatedOrder = await this.ordersRepository.update(orderId, {
        status: OrderStatus.RETURNING,
        returnRequestedAt: new Date(),
      });
      await this.notificationsService.sendNotificationToUser(
        order.userId,
        'Yêu cầu trả hàng đã được ghi nhận',
        `Đơn hàng ${order.code} của bạn đã được chuyển sang trạng thái trả hàng.`,
      );

      return this.mapOrder(updatedOrder);
    } catch (error) {
      this.logger.error(`Lỗi khi yêu cầu trả hàng cho đơn ${orderId}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Không thể cập nhật trả hàng');
    }
  }

  private async cancelOrder(
    orderId: string,
    userId?: string,
  ): Promise<OrderResponseDto> {
    try {
      const order = await this.ordersRepository.findById(orderId);
      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      if (userId && order.userId !== userId) {
        throw new ForbiddenException('Không có quyền thao tác đơn hàng này');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Đơn hàng đã bị hủy trước đó');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Chỉ có thể hủy đơn khi đơn đang ở trạng thái chờ xác nhận',
        );
      }

      const cancelledOrder = await this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const restoredInventoryCount =
            await this.inventoryService.increaseStockAndLogByTx(
              tx,
              item.bookId,
              item.quantity,
              order.userId,
              'Nhập kho do hủy đơn hàng',
            );

          if (restoredInventoryCount === 0) {
            throw new BadRequestException(
              `Không thể hoàn kho cho sách ${item.bookTitle}`,
            );
          }

          await this.bookService.decreaseSoldCountByTx(
            tx as Prisma.TransactionClient,
            item.bookId,
            item.quantity,
          );
        }

        return await this.ordersRepository.updateByTx(tx, orderId, {
          status: OrderStatus.CANCELLED,
        });
      });

      await this.notificationsService.sendNotificationToUser(
        order.userId,
        'Đơn hàng đã bị hủy',
        `Đơn hàng ${order.code} của bạn đã được hủy thành công.`,
      );

      return this.mapOrder(cancelledOrder);
    } catch (error) {
      this.logger.error(`Lỗi khi hủy đơn hàng ${orderId}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Không thể hủy đơn hàng');
    }
  }

  // hàm này để kiểm tra và tính tiền tiền của  item

  private async validateAndPrepareOrderItems(
    filteredItems: CartItemResponseDto[],
    promotionLookup: Map<string, number>,
    // subtotalAmount: number,
    // promotionDiscountAmount: number,
  ): Promise<{
    items: OrderItemPayload[];
    subtotalAmount: number;
    promotionDiscountAmount: number;
  }> {
    //lấy bookId lưu ra thành mảng
    let subtotalAmount = 0;
    let promotionDiscountAmount = 0;
    const bookIds = filteredItems.map((item) => item.book.id);
    //tìm kho theo Id sách
    const inventories = await this.inventoryService.findByBookIds(bookIds);

    const items: OrderItemPayload[] = [];

    for (const cartItem of filteredItems) {
      const inventory = inventories.find(
        (inv) => inv.book.id === cartItem.book.id,
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
    return { items, subtotalAmount, promotionDiscountAmount };
    // kiểm tra nếu có sách nào trong giỏ hàng mà số lượng trong kho không đủ thì sẽ báo lỗi
  }

  private generateOrderCode(): string {
    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${Date.now()}-${randomSuffix}`;
  }

  private mapOrder(order: OrderResponseDto): OrderResponseDto {
    return order;
  }
}
