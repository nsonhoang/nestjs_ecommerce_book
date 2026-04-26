import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';
import { getPagination, buildMeta } from 'src/utils/pagination.util';
import { UserQueryDto } from './dto/user-query.dto';
import { User } from './user.interface';
import { UserUpdateRequestDto } from './dto/user-update.request.dto';

type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  roleId: string;
};

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(input: CreateUserInput): Promise<UserResponseDto> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
        name: input.name,
        phone: input.phone,
        roleId: input.roleId,
        cart: {
          create: {}, // Tạo một cart rỗng khi tạo user mới
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { id: true, name: true } },
      },
    });
  }
  async getUsers(query: UserQueryDto) {
    const { page, limit, keyword, sortBy, sortOrder } = query;
    const { skip, take } = getPagination(page, limit);

    const where = keyword
      ? {
          OR: [
            { email: { contains: keyword } },
            { name: { contains: keyword } },
          ],
        }
      : {};

    const orderBy = {
      [sortBy]: sortOrder,
    } as Record<string, 'asc' | 'desc'>;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
          // addresses: {
          //   include: {
          //     province: true,
          //     ward: true,
          //     district: true,
          //   },
          // },
        },
      }),
      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      data,
      meta: buildMeta(page, limit, total),
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true, // thằng này cần để so sánh mật khẩu, nhưng sẽ không trả về cho client
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true }, // ← chỉ lấy id + name của role
        },
        addresses: true,
      },
    });

    return user as User | null;
  }
  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true },
        },
        addresses: true,
      },
    });

    return user as UserResponseDto | null;
  }

  async updateUser(
    id: string,
    updateData: Partial<UserUpdateRequestDto>,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: {
          select: { id: true, name: true }, // Lấy role
        },
        addresses: {
          include: {
            province: true, // Lưu ý: Tên field trong Schema của bạn là city, không phải province
            district: true,
          },
        },
      },
    });

    return updatedUser as unknown as UserResponseDto;
  }
}
