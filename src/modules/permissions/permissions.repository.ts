import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Permission } from 'generated/prisma/client';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });
  }

  async findByRoleId(roleId: string): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: {
          select: { name: true },
        },
      },
    });

    return rolePermissions.map((rp) => rp.permission.name);
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: {
        id: { in: ids },
      },
    });
  }
}
