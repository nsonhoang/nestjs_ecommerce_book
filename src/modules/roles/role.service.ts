import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RolesRequestDto } from '../roles/dto/roles.dto.request';
import { RolesResponseDto } from '../roles/dto/roles.response.dto';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  getHello(): string {
    return 'Hello User!';
  }
  async createRole(data: RolesRequestDto): Promise<RolesResponseDto> {
    const dataUpperCase = { ...data, name: data.name.toUpperCase() };

    const existing = await this.roleRepository.findByName(dataUpperCase.name);
    console.log('existing', existing);
    if (existing) {
      console.log('Role name đã tồn tại');
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
}
