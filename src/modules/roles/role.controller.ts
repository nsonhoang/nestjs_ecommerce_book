import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { RolesRequestDto } from '../roles/dto/roles.dto.request';
import { RolesResponseDto } from '../roles/dto/roles.response.dto';
import { ApiResponse } from 'src/common/api-response';
import { RoleService } from './role.service';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from './roles.enum';

@Controller('/v1/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  getRoles(): Promise<ApiResponse<RolesResponseDto[]>> {
    return this.roleService
      .getRoles()
      .then((data) => ApiResponse.ok(data, 'Lấy danh sách role thành công'));
  }

  @Post('')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  async createRole(
    @Body() data: RolesRequestDto,
  ): Promise<ApiResponse<RolesResponseDto>> {
    const result = await this.roleService.createRole(data);
    return ApiResponse.ok(result, 'Tạo role thành công');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  async deleteRole(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    await this.roleService.deleteRoleById(id);
    return ApiResponse.message('Xóa role thành công ');
  }
}
