import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import { RolesRequestDto } from '../roles/dto/roles.dto.request';
import { RolesResponseDto } from '../roles/dto/roles.response.dto';
import { ApiResponse } from 'src/common/api-response';
import { RoleService } from './role.service';

@Controller('/v1/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  getRoles(): Promise<ApiResponse<RolesResponseDto[]>> {
    return this.roleService
      .getRoles()
      .then((data) => ApiResponse.ok(data, 'Lấy danh sách role thành công'));
  }

  @Post('')
  @HttpCode(HttpStatus.OK)
  async createRole(
    @Body() data: RolesRequestDto,
  ): Promise<ApiResponse<RolesResponseDto>> {
    const result = await this.roleService.createRole(data);
    return ApiResponse.ok(result, 'Tạo role thành công');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteRole(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    await this.roleService.deleteRoleById(id);
    return ApiResponse.message('Xóa role thành công ');
  }
}
