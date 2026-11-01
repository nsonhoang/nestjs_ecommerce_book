import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS } from '../redis';
import { PermissionsRepository } from './permissions.repository';
import { GroupedPermissionsResponseDto } from './dto/grouped-permissions.response.dto';

const ROLE_PERMS_PREFIX = 'role:permissions:';
const PERMS_CACHE_TTL = 7200; // 2 giờ

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    private readonly permissionsRepository: PermissionsRepository,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async getAllGrouped(): Promise<GroupedPermissionsResponseDto[]> {
    try {
      const all = await this.permissionsRepository.findAll();
      const groupsMap = new Map<string, typeof all>();

      for (const p of all) {
        const list = groupsMap.get(p.module) || [];
        list.push(p);
        groupsMap.set(p.module, list);
      }

      const result: GroupedPermissionsResponseDto[] = [];
      for (const [moduleName, permissions] of groupsMap.entries()) {
        result.push({
          module: moduleName,
          permissions: permissions.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            module: p.module,
          })),
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to get grouped permissions', error);
      throw new InternalServerErrorException('Không thể lấy danh sách quyền hệ thống');
    }
  }

  async getPermissionsByRoleId(roleId: string): Promise<string[]> {
    const key = `${ROLE_PERMS_PREFIX}${roleId}`;

    try {
      // 1. Kiểm tra cache Redis
      const cached = await this.redis.smembers(key);
      if (cached && cached.length > 0) {
        return cached;
      }

      // 2. Cache miss -> Đọc từ database
      const permissions = await this.permissionsRepository.findByRoleId(roleId);

      // 3. Ghi vào Redis Set
      if (permissions.length > 0) {
        const pipeline = this.redis.pipeline();
        pipeline.sadd(key, ...permissions);
        pipeline.expire(key, PERMS_CACHE_TTL);
        await pipeline.exec();
      }

      return permissions;
    } catch (error) {
      this.logger.error(`Error resolving permissions for role ${roleId}`, error);
      // Fallback về database nếu Redis gặp sự cố
      return this.permissionsRepository.findByRoleId(roleId);
    }
  }

  async hasPermission(roleId: string, permission: string): Promise<boolean> {
    const key = `${ROLE_PERMS_PREFIX}${roleId}`;

    try {
      const isMember = await this.redis.sismember(key, permission);
      if (isMember === 1) {
        return true;
      }

      // Nếu trả về 0, kiểm tra xem key có tồn tại trong Redis không (có thể cache miss)
      const keyExists = await this.redis.exists(key);
      if (keyExists === 0) {
        const perms = await this.getPermissionsByRoleId(roleId);
        return perms.includes(permission);
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking permission ${permission} for role ${roleId}`, error);
      const perms = await this.permissionsRepository.findByRoleId(roleId);
      return perms.includes(permission);
    }
  }

  async clearRoleCache(roleId: string): Promise<void> {
    try {
      const key = `${ROLE_PERMS_PREFIX}${roleId}`;
      await this.redis.del(key);
      this.logger.log(`Cleared permissions cache for role ${roleId}`);
    } catch (error) {
      this.logger.error(`Failed to clear permissions cache for role ${roleId}`, error);
    }
  }
}
