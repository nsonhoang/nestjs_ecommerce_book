import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRequestDto } from './dto/auth.request.dto';
import { ApiResponse } from 'src/common/api-response';
import { UserResponseDto } from './dto/user.response..dto';

@Controller('/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: AuthRequestDto): Promise<ApiResponse<boolean>> {
    const user = await this.authService.login(data);
    return ApiResponse.ok(user, 'đăng nhập thành công', HttpStatus.OK);
  }
}
