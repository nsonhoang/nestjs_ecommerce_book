import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RolesRequestDto } from '../roles/dto/roles.dto.request';
import { RolesResponseDto } from '../roles/dto/roles.response.dto';
import { RoleRepository } from './role.repository';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionsService: PermissionsService,
  ) {}
  getHello(): string {
    return 'Hello User!';
  }
  async createRole(data: RolesRequestDto): Promise<RolesResponseDto> {
    const dataUpperCase = { ...data, name: data.name.toUpperCase() };

    const existing = await this.roleRepository.findByName(dataUpperCase.name);
    if (existing) {
      this.logger.warn('Attempted to create duplicate role name');
      throw new BadRequestException('Role name đã tồn tại');
    }
    return await this.roleRepository.createRole(dataUpperCase);
  }
  async getRoles(): Promise<RolesResponseDto[]> {
    return await this.roleRepository.getRoles();
  }
  async deleteRoleById(id: string): Promise<void> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role không tồn tại');
    }
    await this.roleRepository.deleteById(id);
  }

  async findByName(name: string): Promise<RolesResponseDto | null> {
    return await this.roleRepository.findByName(name);
  }

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<RolesResponseDto> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role không tồn tại');
    }

    try {
      await this.roleRepository.assignPermissions(roleId, permissionIds);
      // Xóa cache Redis ngay lập tức để User áp dụng quyền mới
      await this.permissionsService.clearRoleCache(roleId);
      return role;
    } catch (error) {
      this.logger.error(`Failed to assign permissions for role ${roleId}`, error);
      throw new BadRequestException('Không thể gán quyền cho vai trò');
    }
  }

  async getRolePermissions(roleId: string): Promise<string[]> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role không tồn tại');
    }
    return this.roleRepository.getRolePermissions(roleId);
  }
}
