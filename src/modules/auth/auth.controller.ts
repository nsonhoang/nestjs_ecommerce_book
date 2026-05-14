import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from 'express';
import { ApiResponse } from 'src/common/api-response';
import { AuthService } from './auth.service';
import { AuthResponse } from './auth.interface';
import { AuthRequestDto } from './dto/auth.request.dto';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { AuthRegisterRequestDto } from './dto/auth-register.request.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // lấy cả thông tin Os và FCM token để lưu vào database, sau này có thể dùng để gửi thông báo đến thiết bị của user
  @Throttle({ auth: { ttl: 60_000, limit: 5 } })
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() data: AuthRequestDto,
    @Req() req: ExpressRequest, // cái này để lấy deviceId ,( có nên thiết lập request nào cũng có header lầ deviceId hay khong)
    @Res({ passthrough: true }) res: ExpressResponse, // cần phải có cái này để set cookie trong service, nếu không có thì sẽ bị lỗi Can't set headers after they are sent.
  ): Promise<ApiResponse<AuthResponse>> {
    const user = await this.authService.login(data, req, res);
    return ApiResponse.ok(user, 'đăng nhập thành công', HttpStatus.OK);
  }

  //Đăng kí tài khoản mới, có thể thêm các trường như name, phone,... vào AuthRequestDto nếu cần
  // cái này kh cần ratelimit vì sau này sẽ sử dụng node mail đẻ gửi emaIL xác nhận đăng ký
  @Post('/register')
  @HttpCode(HttpStatus.OK)
  async register(
    @Body() data: AuthRegisterRequestDto,
  ): Promise<ApiResponse<UserResponseDto>> {
    const result = await this.authService.register(data);
    return ApiResponse.ok(result, 'Đăng ký thành công', HttpStatus.OK);
  }

  @Throttle({ auth: { ttl: 60_000, limit: 30 } })
  @Post('/refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
    @Headers('x-csrf-token') csrfHeader: string,
  ): Promise<ApiResponse<AuthResponse>> {
    const result = await this.authService.refreshToken(csrfHeader, res, req);
    return ApiResponse.ok(result, 'Refresh token thành công', HttpStatus.OK);
  }

  @Throttle({ auth: { ttl: 60_000, limit: 20 } })
  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: ExpressRequest,
    @Body('fcmToken') fcmToken?: string,
  ): Promise<ApiResponse<string>> {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader?.split(' ')[1];
    console.log('Access Token:', accessToken); // Debug: log access token
    const result = await this.authService.logout(accessToken!, req, fcmToken);
    return ApiResponse.ok(result, 'Logout successful', HttpStatus.OK);
  }
}
