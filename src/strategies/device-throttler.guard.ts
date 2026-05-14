import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { createHash } from 'crypto';

@Injectable()
export class DeviceAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // 1) Nếu có Bearer token: dùng hash token làm tracker (ổn định, khó spoof)
    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : undefined;

    if (token) {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      return `t:${tokenHash}`;
    }

    // 2) Nếu có deviceId
    const deviceIdHeader = req.headers['x-device-id'];
    const deviceId = Array.isArray(deviceIdHeader)
      ? deviceIdHeader[0]
      : deviceIdHeader;

    if (typeof deviceId === 'string' && deviceId.trim().length > 0) {
      return `d:${deviceId.trim()}`;
    }

    // 3) Fallback IP (req.ips chỉ hoạt động đúng khi bật trust proxy)
    const ip = req.ips?.length ? req.ips[0] : req.ip;
    return Promise.resolve(
      `ip:${ip ?? req.socket?.remoteAddress ?? 'unknown'}`,
    );
  }
}
