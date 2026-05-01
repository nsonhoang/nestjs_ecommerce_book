import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { buildMeta, getPagination } from 'src/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentRequestDto } from './dto/shipments.request.dto';
import { PaginateShipmentsDto } from './dto/paginate-shipments.dto';

const shipmentInclude = {
  order: true,
} as const;

type ShipmentWithOrder = Prisma.ShipmentGetPayload<{
  include: typeof shipmentInclude;
}>;

@Injectable()
export class ShipmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // tạo đơn hàng khi hang khi đơn người bán nhấn xác nhận đơn hàng chuyển sang trạng thái processing,
  // khi đó sẽ tạo đơn hàng vận chuyển trong bảng shipment,
  // trạng thái ban đầu sẽ là pending,
  // sau đó khi ghn gửi web hook về thì sẽ cập nhật trạng thái đơn hàng vận chuyển tương ứng
  async createShipment(
    shipmentData: ShipmentRequestDto,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.shipment.create({ data: shipmentData });
  }

  async findByOrderId(orderId: string) {
    return this.prisma.shipment.findUnique({ where: { orderId } });
  }

  async findByGhnCode(ghnCode: string) {
    return this.prisma.shipment.findUnique({
      where: { ghnOrderCode: ghnCode },
    });
  }

  async findById(shipmentId: string) {
    return this.prisma.shipment.findUnique({ where: { id: shipmentId } });
  }

  async getAllShipments(
    query: PaginateShipmentsDto,
  ): Promise<PaginatedResult<ShipmentWithOrder>> {
    const {
      page,
      limit,
      keyword,
      sortBy,
      sortOrder,
      orderId,
      ghnOrderCode,
      status,
      shippingService,
      createFrom,
      createTo,
      shippedFrom,
      shippedTo,
      deliveredFrom,
      deliveredTo,
    } = query;

    const {
      page: safePage,
      limit: safeLimit,
      skip,
      take,
    } = getPagination(page, limit);

    const andConditions: Prisma.ShipmentWhereInput[] = [];

    if (keyword) {
      andConditions.push({
        OR: [
          { ghnOrderCode: { contains: keyword } },
          { status: { contains: keyword } },
          { shippingService: { contains: keyword } },
          {
            order: {
              code: {
                contains: keyword,
              },
            },
          },
        ],
      });
    }

    if (orderId) {
      andConditions.push({ orderId });
    }

    if (ghnOrderCode) {
      andConditions.push({
        ghnOrderCode: {
          contains: ghnOrderCode,
        },
      });
    }

    if (status) {
      andConditions.push({ status });
    }

    if (shippingService) {
      andConditions.push({ shippingService });
    }

    if (createFrom || createTo) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (createFrom) dateFilter.gte = createFrom;
      if (createTo) dateFilter.lte = createTo;
      andConditions.push({ createdAt: dateFilter });
    }

    if (shippedFrom || shippedTo) {
      const dateFilter: Prisma.DateTimeNullableFilter = {};
      if (shippedFrom) dateFilter.gte = shippedFrom;
      if (shippedTo) dateFilter.lte = shippedTo;
      andConditions.push({ shippedAt: dateFilter });
    }

    if (deliveredFrom || deliveredTo) {
      const dateFilter: Prisma.DateTimeNullableFilter = {};
      if (deliveredFrom) dateFilter.gte = deliveredFrom;
      if (deliveredTo) dateFilter.lte = deliveredTo;
      andConditions.push({ deliveredAt: dateFilter });
    }

    const where: Prisma.ShipmentWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const allowedSortByFields = [
      'createdAt',
      'updatedAt',
      'expectedDelivery',
      'shippedAt',
      'deliveredAt',
      'shippingFee',
      'codAmount',
      'status',
    ];
    const sortByField = allowedSortByFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const orderBy = {
      [sortByField]: sortOrder,
    } as Record<string, 'asc' | 'desc'>;

    const [data, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        skip,
        take,
        orderBy,
        include: shipmentInclude,
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      data,
      meta: buildMeta(safePage, safeLimit, total),
    };
  }

  async updateShipmentStatus(shipmentId: string, status: string) {
    // cập nhật trạng thái đơn hàng
    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status },
    });
  }

  async updateByGhnCode(
    ghnCode: string,
    data: Prisma.ShipmentUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    await client.shipment.update({
      where: { ghnOrderCode: ghnCode },
      data,
    });
  }
}
