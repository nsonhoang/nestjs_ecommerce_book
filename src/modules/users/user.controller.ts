import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { type Request } from 'express';
import { minutes, Throttle } from '@nestjs/throttler';

import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { type JwtUser } from 'src/strategies/jwt-payload.interface';

import { ApiResponse } from 'src/common/api-response';
import { UserResponseDto } from './dto/user-response.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from '../roles/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserQueryDto } from './dto/user-query.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import {
  UserUpdateByUserRequestDto,
  UserUpdateRequestDto,
} from './dto/user-update.request.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

export type RequestWithUser = Request & { user: JwtUser };

@ApiTags('Users')
@ApiBearerAuth()
@Controller('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Lấy profile của user' })
  @ApiOkResponse({ description: 'Lấy profile thành công' })
  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: minutes(1), limit: 60 } })
  async getProfile(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.userService.getProfile(req.user);

    return ApiResponse.ok(user, 'Lấy thông tin người dùng thành công');
  }
  @ApiOperation({ summary: 'Cập nhật profile của user' })
  @ApiBody({ type: UserUpdateByUserRequestDto })
  @ApiOkResponse({ description: 'Cập nhật profile thành công' })
  @Patch('/profile')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async updateUserByUser(
    @Req() req: RequestWithUser,
    @Body() data: UserUpdateByUserRequestDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const updatedUser = await this.userService.updateUserByUser(
      req.user.userId,
      data,
    );
    return ApiResponse.ok(updatedUser, 'Cập nhật thông tin thành công');
  }

  @ApiOperation({ summary: 'Lấy danh sách user (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiOkResponse({ description: 'Lấy danh sách user thành công' })
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  @Throttle({ default: { ttl: minutes(1), limit: 30 } })
  async getAllUsers(
    @Query() query: UserQueryDto,
  ): Promise<ApiResponse<PaginatedResult<UserResponseDto>>> {
    const result = await this.userService.getUsers(query);
    return ApiResponse.ok(result, 'Lấy danh sách user thành công');
  }

  @ApiOperation({ summary: 'Lấy user theo id (admin)' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiOkResponse({ description: 'Lấy user thành công' })
  @Get('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  @Throttle({ default: { ttl: minutes(1), limit: 60 } })
  async getUserById(
    @Param('id') id: string,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.userService.getUserById(id);
    return ApiResponse.ok(user, 'Lấy thông tin người dùng thành công');
  }

  @ApiOperation({ summary: 'Cập nhật user theo id (admin)' })
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiBody({ type: UserUpdateRequestDto })
  @ApiOkResponse({ description: 'Cập nhật user thành công' })
  @Patch('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async updateUserByAdmin(
    @Param('id') id: string,
    @Body() request: UserUpdateRequestDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const updatedUser = await this.userService.updateUserByAdmin(id, request);
    if (request.roleId) {
      const message = `Cập nhật thông tin người dùng thành công. Lưu ý: Role đã được cập nhật thành ${request.roleId}, vui lòng kiểm tra lại thông tin người dùng sau khi cập nhật.`;
      return ApiResponse.ok(updatedUser, message);
    }
    return ApiResponse.ok(
      updatedUser,
      'Cập nhật thông tin người dùng thành công',
    );
  }
}
