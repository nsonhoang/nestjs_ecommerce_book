/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    // err: lỗi từ passport
    // user: payload đã validate (nếu OK)
    // info: { name, message } khi token invalid/expired

    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Access token đã hết hạn');
    }
    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('Access token không hợp lệ');
    }
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
