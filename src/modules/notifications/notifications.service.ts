import { Injectable, Logger } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
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
