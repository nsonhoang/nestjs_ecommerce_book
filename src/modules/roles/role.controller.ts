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
import { minutes, Throttle } from '@nestjs/throttler';

import { RolesRequestDto } from '../roles/dto/roles.dto.request';
import { RolesResponseDto } from '../roles/dto/roles.response.dto';
import { ApiResponse } from 'src/common/api-response';
import { RoleService } from './role.service';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from './roles.enum';
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async deleteRole(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    await this.roleService.deleteRoleById(id);
    return ApiResponse.message('Xóa role thành công ');
  }
}
