import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from './dto/user.response..dto';
import { UserRequestDto } from './dto/user.request.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRequestDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user as UserRequestDto | null;
  }
}
