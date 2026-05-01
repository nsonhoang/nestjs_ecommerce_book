/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import 'dotenv/config';

@Injectable()

// tích hợp notification khi có đơn hàng mới từ GHN hoặc khi đổi trạng thái đơn hàng
export class GhnWebhookGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const secretToken = process.env.GHN_TOKEN; // Đảm bảo GHN_TOKEN được đặt trong .env của bạn
    const tokenHeaderRaw = request.headers['token'];
    console.log('Received GHN webhook with token:', tokenHeaderRaw); // Log token nhận được để kiểm tra
    const tokenHeader = Array.isArray(tokenHeaderRaw)
      ? tokenHeaderRaw[0]
      : tokenHeaderRaw;

    return tokenHeader === secretToken;
  }
}
