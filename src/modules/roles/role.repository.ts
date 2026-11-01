import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolesRequestDto } from '../roles/dto/roles.dto.request';
import { RolesResponseDto } from '../roles/dto/roles.response.dto';

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(data: RolesRequestDto): Promise<RolesResponseDto> {
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
      },
    });
    return role;
  }
  async getRoles(): Promise<RolesResponseDto[]> {
    const roles = await this.prisma.role.findMany();
    return roles;
  }

  async findByName(name: string): Promise<RolesResponseDto | null> {
    const role = await this.prisma.role.findUnique({
      where: {
        name,
      },
    });
    return role;
  }
  async findById(id: string): Promise<RolesResponseDto | null> {
    const role = await this.prisma.role.findUnique({
      where: {
        id,
      },
    });
    return role;
  }
  async deleteById(id: string): Promise<void> {
    await this.prisma.role.delete({
      where: {
        id,
      },
    });
  }

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });
  }

  async getRolePermissions(roleId: string): Promise<string[]> {
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
}
