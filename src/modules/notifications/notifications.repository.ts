import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveDeviceToken(userId: string, FCMtoken: string, deviceOs: string) {
    return await this.prisma.deviceToken.upsert({
      where: {
        token: FCMtoken,
      },
      update: {
        userId,
        deviceOs,
      },
      create: {
        userId,
        token: FCMtoken,
        deviceOs,
      },
    });
  }

  // Xóa Token khi User đăng xuất
  async removeDeviceToken(token: string) {
    return this.prisma.deviceToken.deleteMany({
      where: { token },
    });
  }

  async removeManyDeviceToken(tokens: string[]) {
    return this.prisma.deviceToken.deleteMany({
      where: { token: { in: tokens } },
    });
  }

  async getUserDeviceTokens(userId: string) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    return tokens.map((t) => t.token);
  }

  async deleteDeviceToken(userId: string, FCMtoken: string) {
    await this.prisma.deviceToken.deleteMany({
      where: {
        userId,
        token: FCMtoken,
      },
    });
  }
}
