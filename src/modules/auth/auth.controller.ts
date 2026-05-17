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
  Param,
  Patch,
} from '@nestjs/common';
import {
  type Request as ExpressRequest,
  type Response as ExpressResponse,
} from 'express';
import { ApiResponse } from 'src/common/api-response';
import { AuthService } from './auth.service';
import { AuthResponse, ResetPasswordPayload } from './auth.interface';
import { AuthRequestDto } from './dto/auth.request.dto';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { AuthRegisterRequestDto } from './dto/auth-register.request.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { minutes, Throttle } from '@nestjs/throttler';
import { AuthChangePasswordRequestDto } from './dto/auth-change-password.request.dto';
import { type RequestWithUser } from '../users/user.controller';
import { ResetPasswordRequestDto } from './dto/reset-password.requset.dto';
import { ResetPasswordConfirmGuard } from 'src/strategies/reset-passwword-confirm.decorator';
import { ValidateOtpRequestDto } from './dto/validate-otp.request.dto';
import { ConfirmResetPasswordRequestDto } from './dto/confirm-reset-password.requset.dto';

type RequestWithEmail = ExpressRequest & { user: string }; // đặt user là do mặc định của jwtModule này là thằng sẽ trả vể ở hàm validate của strategy
@Controller('/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // lấy cả thông tin Os và FCM token để lưu vào database, sau này có thể dùng để gửi thông báo đến thiết bị của user
  @Throttle({ auth: { ttl: 60000 * 5, limit: 5 } })
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
  @Throttle({ auth: { ttl: minutes(30), limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async register(
    @Body() data: AuthRegisterRequestDto,
  ): Promise<ApiResponse<string>> {
    const result = await this.authService.register(data);
    return ApiResponse.ok(
      result,
      'Vui lòng kiểm tra email của bạn để xác nhận đăng ký',
      HttpStatus.OK,
    );
  }
  // cái end point này sẽ sác nhận đăng kí bằng cách xác thực otp nếu thành công sẽ trả về thông tin user
  @Post('/register/:otpToken')
  @Throttle({ auth: { ttl: minutes(30), limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async confirmEmailRegistration(
    @Body() data: ValidateOtpRequestDto,
    @Param('otpToken') otpToken: string,
  ): Promise<ApiResponse<UserResponseDto>> {
    const result = await this.authService.confirmEmailRegistration(
      data.otp,
      otpToken,
    );
    return ApiResponse.ok(result, 'Đăng kí thành công', HttpStatus.OK);
  }

  @Post('/refresh-token')
  @Throttle({ auth: { ttl: 60000 * 5, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
    @Headers('x-csrf-token') csrfHeader: string,
  ): Promise<ApiResponse<AuthResponse>> {
    const result = await this.authService.refreshToken(csrfHeader, res, req);
    return ApiResponse.ok(result, 'Refresh token thành công', HttpStatus.OK);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { ttl: 60000 * 5, limit: 20 } })
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

  // 1 endpoint để đổi mật khẩu nhưng phải ratelimit cho nó 5 lần trong 30p
  @Post('/change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { ttl: 1800000, limit: 5 } })
  async changePassword(
    @Body() data: AuthChangePasswordRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<string>> {
    return ApiResponse.ok(
      await this.authService.changePassword(data, req.user), // cái này là token
      'Đổi mật khẩu thành công',
      HttpStatus.OK,
    );
  }

  @Post('/reset-password')
  @Throttle({ auth: { ttl: minutes(30), limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() data: ResetPasswordRequestDto,
  ): Promise<ApiResponse<string>> {
    const result = await this.authService.resetPassword(data.email);
    return ApiResponse.ok(
      result,
      'Mã OTP đã được gửi đến email của bạn',
      HttpStatus.OK,
    );
  }
  // cái này dùng để xác thực otp
  @Post('/reset-password/:otpToken')
  // giới hạn 1 OTP chỉ được xác thực 5 lần
  @Throttle({ auth: { ttl: minutes(5), limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async verifyResetPasswordOTP(
    @Body() data: ValidateOtpRequestDto,
    @Param('otpToken') otpToken: string,
  ): Promise<ApiResponse<string>> {
    const result = await this.authService.verifyResetPasswordToken(
      data.otp,
      otpToken,
    );
    return ApiResponse.ok(result, 'OTP verified successfully', HttpStatus.OK);
  }
  // cái này dùng để đổi mật khẩu luôn
  @Patch('/reset-password/confirm')
  @Throttle({ auth: { ttl: minutes(5), limit: 5 } })
  @UseGuards(ResetPasswordConfirmGuard)
  @HttpCode(HttpStatus.OK)
  async resetPasswordWithToken(
    @Body() data: ConfirmResetPasswordRequestDto,
    @Req() req: RequestWithEmail,
  ) {
    const result = await this.authService.resetPasswordWithToken(
      data.newPassword,
      req.user,
    );
    return ApiResponse.ok(
      result,
      'Cập nhật mật khẩu mới thành công',
      HttpStatus.OK,
    );
  }
}
