import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { OrderResponseDto } from './dto/order.response.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { PaginateOrderDto } from './dto/pagination-orders.dto';
import { buildMeta, getPagination } from 'src/utils/pagination.util';

const orderInclude = {
  items: true,
  shipment: true,
} as const;

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tx: Prisma.TransactionClient,
    data: Prisma.OrderCreateInput,
  ): Promise<Prisma.OrderGetPayload<{ include: typeof orderInclude }>> {
    return await tx.order.create({
      data,
      include: orderInclude,
    });
  }

  async findByFilter(
    paginationQuery: PaginateOrderDto,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const { page, limit, keyword, sortBy, sortOrder } = paginationQuery;

    const {
      page: safePage,
      limit: safeLimit,
      skip,
      take,
    } = getPagination(page, limit);

    const andConditions: Prisma.OrderWhereInput[] = [];

    if (keyword) {
      andConditions.push({
        shippingName: {
          contains: keyword,
        },
      });
    }

    //nếu có userId thì lọc theo userId
    if (paginationQuery.userId) {
      andConditions.push({
        userId: paginationQuery.userId,
      });
    }

    //có createFrom, createTo thì lọc theo khoảng thời gian tạo đơn hàng
    if (paginationQuery.createFrom || paginationQuery.createTo) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (paginationQuery.createFrom) {
        dateFilter.gte = paginationQuery.createFrom;
      }
      if (paginationQuery.createTo) {
        dateFilter.lte = paginationQuery.createTo;
      }
      andConditions.push({
        createdAt: dateFilter,
      });
    }

    //có updateFrom, updateTo thì lọc theo khoảng thời gian cập nhật đơn hàng
    if (paginationQuery.updateFrom || paginationQuery.updateTo) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (paginationQuery.updateFrom) {
        dateFilter.gte = paginationQuery.updateFrom;
      }
      if (paginationQuery.updateTo) {
        dateFilter.lte = paginationQuery.updateTo;
      }
      andConditions.push({
        updatedAt: dateFilter,
      });
    }

    if (paginationQuery.paymentMethod) {
      andConditions.push({
        paymentMethod: paginationQuery.paymentMethod,
      });
    }

    if (paginationQuery.minAmount || paginationQuery.maxAmount) {
      andConditions.push({
        totalAmount: {
          ...(paginationQuery.minAmount && { gte: paginationQuery.minAmount }),
          ...(paginationQuery.maxAmount && { lte: paginationQuery.maxAmount }),
        },
      });
    }

    // nếu có status thì lọc theo status
    if (paginationQuery.status) {
      andConditions.push({
        status: paginationQuery.status,
      });
    }

    // nếu có code thì lọc theo code
    if (paginationQuery.code) {
      andConditions.push({
        code: {
          contains: paginationQuery.code,
        },
      });
    }

    // nếu có shippingPhone thì lọc theo shippingPhone
    if (paginationQuery.shippingPhone) {
      andConditions.push({
        shippingPhone: {
          contains: paginationQuery.shippingPhone,
        },
      });
    }
    // nếu có shippingAddress thì lọc theo shippingAddress
    if (paginationQuery.shippingAddress) {
      andConditions.push({
        shippingAddress: {
          contains: paginationQuery.shippingAddress,
        },
      });
    }

    // nếu có shippingWard thì lọc theo shippingWard
    if (paginationQuery.shippingWard) {
      andConditions.push({
        shippingWard: {
          contains: paginationQuery.shippingWard,
        },
      });
    }

    // nếu có shippingDistrict thì lọc theo shippingDistrict
    if (paginationQuery.shippingDistrict) {
      andConditions.push({
        shippingDistrict: {
          contains: paginationQuery.shippingDistrict,
        },
      });
    }

    // nếu có shippingCity thì lọc theo shippingCity
    if (paginationQuery.shippingCity) {
      andConditions.push({
        shippingCity: {
          contains: paginationQuery.shippingCity,
        },
      });
    }

    const where: Prisma.OrderWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const allowedSortByFields = ['createdAt', 'updatedAt', 'totalAmount'];
    const sortByField = allowedSortByFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const orderBy = {
      [sortByField]: sortOrder,
    } as Record<string, 'asc' | 'desc'>;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy,
        include: orderInclude,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: buildMeta(safePage, safeLimit, total),
    };
  }

  // 1 hàm tìm theo đếm theo sách đc mua nhiều nhất để thống kể

  async findById(id: string): Promise<OrderResponseDto | null> {
    return await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  async findByUserId(userId: string): Promise<OrderResponseDto[]> {
    return await this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
    });
  }
  async updateStatus() {
    //nếu hủy đơn thì phải cộng số lượng lại vào kho
    //còn thêm module shipment nữa
  }
}
