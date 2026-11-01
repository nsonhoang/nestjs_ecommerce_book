import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { minutes, Throttle } from '@nestjs/throttler';

import { RolesRequestDto } from '../roles/dto/roles.dto.request';
import { RolesResponseDto } from '../roles/dto/roles.response.dto';
import { AssignRolePermissionsDto } from './dto/assign-role-permissions.dto';
import { ApiResponse } from 'src/common/api-response';
import { RoleService } from './role.service';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { AppPermission } from '../permissions';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('/v1/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiOperation({ summary: 'Lấy danh sách role (admin)' })
  @ApiOkResponse({ description: 'Lấy danh sách role thành công' })
  @Get('')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(AppPermission.ROLE_READ)
  @Throttle({ default: { ttl: minutes(1), limit: 60 } })
  getRoles(): Promise<ApiResponse<RolesResponseDto[]>> {
    return this.roleService
      .getRoles()
      .then((data) => ApiResponse.ok(data, 'Lấy danh sách role thành công'));
  }

  @ApiOperation({ summary: 'Tạo role (admin)' })
  @ApiBody({ type: RolesRequestDto })
  @ApiOkResponse({ description: 'Tạo role thành công' })
  @Post('')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(AppPermission.ROLE_CREATE)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async createRole(
    @Body() data: RolesRequestDto,
  ): Promise<ApiResponse<RolesResponseDto>> {
    const result = await this.roleService.createRole(data);
    return ApiResponse.ok(result, 'Tạo role thành công');
  }

  @ApiOperation({ summary: 'Xóa role (admin)' })
  @ApiParam({ name: 'id', description: 'Role id' })
  @ApiOkResponse({ description: 'Xóa role thành công' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(AppPermission.ROLE_DELETE)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async deleteRole(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    await this.roleService.deleteRoleById(id);
    return ApiResponse.message('Xóa role thành công ');
  }

  @ApiOperation({ summary: 'Lấy danh sách quyền của role (admin)' })
  @ApiParam({ name: 'id', description: 'Role id' })
  @ApiOkResponse({ description: 'Lấy danh sách quyền của role thành công' })
  @Get(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(AppPermission.ROLE_READ)
  async getRolePermissions(
    @Param('id') id: string,
  ): Promise<ApiResponse<string[]>> {
    const permissions = await this.roleService.getRolePermissions(id);
    return ApiResponse.ok(permissions, 'Lấy danh sách quyền của role thành công');
  }

  @ApiOperation({ summary: 'Gán quyền cho role (admin)' })
  @ApiParam({ name: 'id', description: 'Role id' })
  @ApiBody({ type: AssignRolePermissionsDto })
  @ApiOkResponse({ description: 'Gán quyền cho role thành công' })
  @Patch(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(AppPermission.ROLE_UPDATE)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async assignRolePermissions(
    @Param('id') id: string,
    @Body() body: AssignRolePermissionsDto,
  ): Promise<ApiResponse<RolesResponseDto>> {
    const updatedRole = await this.roleService.assignPermissions(
      id,
      body.permissionIds,
    );
    return ApiResponse.ok(updatedRole, 'Gán quyền cho role thành công');
  }
}
