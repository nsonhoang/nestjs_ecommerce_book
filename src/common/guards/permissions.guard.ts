import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { JwtUser } from 'src/strategies/jwt-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Endpoint không yêu cầu permission cụ thể -> Cho phép qua
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtUser | undefined = request.user;

    if (!user) {
      throw new UnauthorizedException('Người dùng chưa được xác thực');
    }

    // 1. CƠ CHẾ MIỄN TỬ (SUPER ADMIN BYPASS):
    // Super Admin có toàn quyền tuyệt đối với mọi API của hệ thống
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return true;
    }

    if (!user.roleId) {
      throw new ForbiddenException(
        'Không xác định được mã vai trò (roleId) của người dùng',
      );
    }

    // 2. KIỂM TRA TỪNG QUYỀN QUA REDIS (RUNTIME CHECK O(1))
    for (const permission of requiredPermissions) {
      const hasPermission = await this.permissionsService.hasPermission(
        user.roleId,
        permission,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Bạn không có quyền thực hiện thao tác này (${permission})`,
        );
      }
    }

    return true;
  }
}
