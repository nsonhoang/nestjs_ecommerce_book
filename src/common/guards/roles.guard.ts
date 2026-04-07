import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { JwtUser } from 'src/strategies/jwt-payload.interface';
import { ROLES_KEY } from '../decortators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    const user = req.user;
    if (!user) throw new UnauthorizedException('Chưa đăng nhập');

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền truy cập API này');
    }
    return true;
  }
}
