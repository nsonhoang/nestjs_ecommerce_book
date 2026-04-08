import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { type Request } from 'express';

import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { type JwtUser } from 'src/strategies/jwt-payload.interface';

import { ApiResponse } from 'src/common/api-response';
import { UserResponseDto } from './dto/user.response..dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from '../roles/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserQueryDto } from './dto/user-query.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { User } from 'generated/prisma/browser';
import { UserUpdateRequestDto } from './dto/user-update.requset.dto';

export type RequestWithUser = Request & { user: JwtUser };

@Controller('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.userService.getProfile(req.user);

    return ApiResponse.ok(user, 'Lấy thông tin người dùng thành công');
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  async getAllUsers(
    @Query() query: UserQueryDto,
  ): Promise<ApiResponse<PaginatedResult<UserResponseDto>>> {
    const result = await this.userService.getUsers(query);
    return ApiResponse.ok(result, 'Lấy danh sách user thành công');
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  async getUserById(
    @Param('id') id: string,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.userService.getUserById(id);
    return ApiResponse.ok(user, 'Lấy thông tin người dùng thành công');
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
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
