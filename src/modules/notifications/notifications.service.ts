import { Injectable, Logger } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import * as admin from 'firebase-admin';
import * as path from 'path';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    @InjectQueue('notifications-queue')
    private readonly notificationQueue: Queue,
  ) {
    if (!admin.apps.length) {
      // Tạo đường dẫn tuyệt đối từ thư mục gốc của dự án
      const serviceAccountPath = path.resolve(
        process.cwd(),
        'nestjs-ecommerce-book-firebase-adminsdk.json',
      );

      admin.initializeApp({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-require-imports
        credential: admin.credential.cert(require(serviceAccountPath)),
      });
    }
  }

  // gửi thông báo đến thiết bị của người dùng
  async sendNotificationToUser(userId: string, title: string, body: string) {
    const devices =
      await this.notificationsRepository.getUserDeviceTokens(userId);
    if (devices.length === 0) {
      this.logger.warn(`No device tokens found for user ${userId}`);
      return;
    }

    const tokens = devices.map((token) => token);
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title,
          body,
        },
      });
      this.logger.log(
        `Gửi thông báo thành công: ${response.successCount} thiết bị`,
      );

      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        // Xóa các token không hợp lệ khỏi database
        await this.notificationsRepository.removeManyDeviceToken(failedTokens);
        this.logger.warn(
          `Đã xóa ${failedTokens.length} token không hợp lệ khỏi database`,
        );
      }
    } catch (error) {
      this.logger.error('Lỗi gửi thông báo', error);
    }
  }

  // gửi cho nhiều người dùng có chỉ định

  async sendNotificationToUsers(
    userIds: string[],
    title: string,
    body: string,
  ) {
    await this.notificationQueue.addBulk(
      userIds.map((userId) => ({
        name: 'send-notification',
        data: { userId, title, body },
      })),
    );
  }

  // hàm này gửi tắt cả thông báo đến thiết bị của người dùng mà trước hết người dùng phải subscribe vào 1 topic nào đó, ví dụ như topic "sales" để nhận thông báo về các chương trình khuyến mãi
  async sendNotificationToTopic(topic: string, title: string, body: string) {
    // mặc định là người dùng phải lúc đăng nhập phải đằng kí vào topic "sales"
    // để nhận thông báo về các chương trình khuyến mãi,
    //  nếu không có topic nào thì sẽ gửi đến tất cả người dùng đã subscribe vào topic đó
    try {
      const response = await admin.messaging().send({
        topic,
        notification: {
          title,
          body,
        },
      });
      this.logger.log(
        `Gửi thông báo đến topic ${topic} thành công: ${response}`,
      );
    } catch (error) {
      this.logger.error(`Lỗi gửi thông báo đến topic ${topic}`, error);
    }
  }

  async saveDeviceToken(userId: string, FCMtoken: string, deviceOs: string) {
    try {
      return await this.notificationsRepository.saveDeviceToken(
        userId,
        FCMtoken,
        deviceOs,
      );
    } catch (error) {
      //   const errorMessage =
      //     error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to save device token for user ${userId}: ${error}`,
      );
      throw error;
    }
  }
  // lúc đăng xuất khỏi thiết bị thì xóa token đó đi khỏi database
  async removeDeviceToken(token: string) {
    try {
      return await this.notificationsRepository.removeDeviceToken(token);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to remove device token ${token}: ${errorMessage}`,
      );
      throw error;
    }
  }
}
