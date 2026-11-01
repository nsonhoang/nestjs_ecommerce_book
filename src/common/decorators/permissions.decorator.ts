import { SetMetadata } from '@nestjs/common';
import { AppPermission } from 'src/modules/permissions/permissions.enum';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator yêu cầu một hoặc nhiều quyền để truy cập endpoint.
 * Có thể truyền vào chuỗi (ví dụ 'book:create') hoặc AppPermission enum.
 */
export const RequirePermissions = (...permissions: (AppPermission | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
