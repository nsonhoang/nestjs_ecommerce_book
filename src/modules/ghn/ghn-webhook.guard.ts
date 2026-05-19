/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import 'dotenv/config';

@Injectable()

// tích hợp notification khi có đơn hàng mới từ GHN hoặc khi đổi trạng thái đơn hàng
export class GhnWebhookGuard implements CanActivate {
  private readonly logger = new Logger(GhnWebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers?: Record<string, unknown> }>();
    const secretToken = process.env.GHN_TOKEN; // Đảm bảo GHN_TOKEN được đặt trong .env của bạn

    const tokenHeaderRaw = request.headers?.['token'];
    const tokenHeader = Array.isArray(tokenHeaderRaw)
      ? tokenHeaderRaw[0]
      : tokenHeaderRaw;

    const isValid =
      typeof tokenHeader === 'string' &&
      typeof secretToken === 'string' &&
      tokenHeader === secretToken;

    if (!isValid) {
      this.logger.warn('Rejected GHN webhook: invalid token header');
    }

    return isValid;
  }
}
