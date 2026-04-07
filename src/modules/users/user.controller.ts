import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { type Request } from 'express';

import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { type JwtUser } from 'src/strategies/jwt-payload.interface';

import { ApiResponse } from 'src/common/api-response';
import { UserResponseDto } from './dto/user.response..dto';

export type RequestWithUser = Request & { user: JwtUser };

@Controller('/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  get(): string {
    return this.userService.getHello();
  }

  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<UserResponseDto>> {
    const user = await this.userService.getProfile(req.user);

    return ApiResponse.ok(user, 'Lấy thông tin người dùng thành công');
  }
}
