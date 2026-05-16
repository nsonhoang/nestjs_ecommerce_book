import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ResetPasswordPayload } from 'src/modules/auth/auth.interface';

@Injectable()
// Quan trọng: Truyền đúng cái mật danh 'reset-password-confirm' vào tham số thứ 2
export class ResetPasswordConfirmStrategy extends PassportStrategy(
  Strategy,
  'reset-password-confirm',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  validate(payload: ResetPasswordPayload) {
    // Dữ liệu payload này sẽ bay vào cái biến "email" trong hàm handleRequest
    return payload.email;
  }
}
