import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { User } from './user.interface';
import { UserResponseDto } from './dto/user.response..dto';
import { AuthRole } from '../roles/roles.enum';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(
    input: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<UserResponseDto> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
        name: input.name,
        phone: input.phone, // không dùng ?:
        roleId: input.role.id,
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
      },
    });

    return user as UserResponseDto | null;
  }
}
