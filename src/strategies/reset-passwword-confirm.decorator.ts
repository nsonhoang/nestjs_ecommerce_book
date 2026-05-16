import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ResetPasswordConfirmGuard extends AuthGuard(
  'reset-password-confirm',
) {
  handleRequest(err: any, email: any, info: any) {
    if (err || !email) {
      throw err || new UnauthorizedException('Unauthorized');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return email;
  }
}
