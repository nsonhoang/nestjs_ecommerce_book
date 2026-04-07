import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  ForbiddenException,
  Body,
  UseGuards,
} from '@nestjs/common';
import { type Request, type Response as ExpressResponse } from 'express';
import { ApiResponse } from 'src/common/api-response';
import { AuthService } from './auth.service';
import { AuthResponse } from './auth.interface';
import { AuthRequestDto } from './dto/auth.request.dto';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';

@Controller('/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() data: AuthRequestDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<ApiResponse<AuthResponse>> {
    const user = await this.authService.login(data, res);
    return ApiResponse.ok(user, 'đăng nhập thành công', HttpStatus.OK);
  }

  //Đăng kí tài khoản mới, có thể thêm các trường như name, phone,... vào AuthRequestDto nếu cần
  @Post('/register')
  @HttpCode(HttpStatus.OK)
  register(): string {
    const result = this.authService.register();
    return result;
  }

  @Post('/refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
    @Headers('x-csrf-token') csrfHeader?: string,
  ): Promise<ApiResponse<AuthResponse>> {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    const csrfCookie = req.cookies?.csrfToken as string | undefined;

    if (!refreshToken)
      throw new UnauthorizedException('Không tìm thấy refresh token');
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      throw new ForbiddenException('CSRF token không hợp lệ');
    }

    const result = await this.authService.refreshToken(refreshToken, res);
    return ApiResponse.ok(result, 'Refresh token thành công', HttpStatus.OK);
  }
  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request): Promise<ApiResponse<string>> {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader?.split(' ')[1];
    console.log('Access Token:', accessToken); // Debug: log access token
    const result = await this.authService.logout(accessToken!);
    return ApiResponse.ok(result, 'Logout successful', HttpStatus.OK);
  }
}
