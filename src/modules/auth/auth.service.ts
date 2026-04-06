import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../users/user.repository';
import { AuthRequestDto } from './dto/auth.request.dto';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.interface';
import { AuthResponse } from './auth.interface';
import { Response } from 'express';
import * as crypto from 'crypto';
import { JwtPayload, JwtUser } from 'src/strategies/jwt-payload.interface';
import { REDIS } from '../redis/redis.module';
import type Redis from 'ioredis';

const REFRESH_TOKEN_TIME = 7 * 24 * 60 * 60; // 7 ngày tính theo giây

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  //xử lý global exception
  // format response
  //validate role name kh đc trùng

  async login(
    authRequest: AuthRequestDto,
    res: Response, // cái này để set cookie, nhưng sẽ không trả về cho client
  ): Promise<AuthResponse> {
    try {
      const user = await this.validate(authRequest);
      const cfrsToken = this.generateCsrfToken();
      const refreshToken = this.generateRefreshToken(
        user.id,
        user.email,
        user.role.name,
      );
      const isProd = process.env.NODE_ENV === 'production';

      await this.redis.set(
        `refreshToken:${user.id}`,
        this.hashToken(refreshToken),
        'EX',
        REFRESH_TOKEN_TIME,
      );
      const isSet = await this.redis.exists(`refreshToken:${user.id}`);
      if (!isSet) {
        this.logger.error(
          `Failed to store refresh token for user ${user.id} in Redis`,
        );
        throw new Error('Failed to store refresh token');
      }

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd, // Chỉ gửi cookie qua HTTPS
        sameSite: 'lax', // Ngăn chặn CSRF
        maxAge: REFRESH_TOKEN_TIME * 1000, // 7 ngày
        path: '/v1/auth/refresh-token',
      });
      res.cookie('csrfToken', cfrsToken, {
        httpOnly: false, // Có thể truy cập từ JavaScript để gửi kèm trong header
        secure: isProd, //để cookie chỉ được gửi qua HTTPS, giúp bảo vệ dữ liệu khỏi bị đánh cắp qua kết nối không an toàn
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_TIME * 1000,
        path: '/v1/auth/refresh-token', // Đảm bảo cookie được gửi cho tất cả các endpoint
      });

      return {
        accessToken: this.generateAccessToken(
          user.id,
          user.email,
          user.role.name,
        ),
        expiresAt: 900000, // 15 phút
        // Tạo CSRF token và gửi về client,
        csrfToken: cfrsToken,
        tokenType: 'Bearer',
      };
    } catch (error) {
      this.logger.error('Đăng nhập thất bại', error);
      throw new UnauthorizedException(
        'Đăng nhập thất bại: ' +
          (error instanceof Error ? error.message : 'Lỗi không xác định'),
      );
    }
  }

  private async validate(authRequest: AuthRequestDto): Promise<User> {
    const user = await this.userRepository.findByEmail(authRequest.email);

    if (!user) {
      throw new NotFoundException(
        'Không tìm thấy người dùng với email ' + authRequest.email,
      );
    }
    const isMatch = await bcrypt.compare(authRequest.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không đúng');
    }
    return user;
  }

  private generateAccessToken(
    userId: string,
    email: string,
    role: string,
  ): string {
    return this.jwtService.sign({
      sub: userId,
      email: email,
      role: role,
    });
  }

  private generateRefreshToken(
    userId: string,
    email: string,
    role: string,
  ): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email: email,
        role: role,
      },
      {
        expiresIn: '7d',
      },
    );
  }

  private generateCsrfToken(): string {
    // Tạo một token ngẫu nhiên, có thể sử dụng thư viện như uuid hoặc crypto
    return crypto.randomBytes(32).toString('hex'); // Ví dụ đơn giản, nên dùng thư viện để tạo token mạnh hơn
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  register() {
    return 'đăng ký thành công';
  }

  async logout() {}

  async refreshToken(
    refreshToken: string,
    res: Response,
  ): Promise<AuthResponse> {
    try {
      // 1) Verify refresh token
      const payload: JwtPayload = await this.jwtService.verify(refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          process.env.JWT_SECRET ||
          'your-secret-key',
      });

      const storedHash = await this.redis.get(`refreshToken:${payload.sub}`);
      const incomingHash = this.hashToken(refreshToken);

      if (!storedHash || storedHash !== incomingHash) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }
      await this.redis.del(`refreshToken:${payload.sub}`); // Xóa refresh token cũ sau khi đã xác thực thành công

      const newCsrfToken = this.generateCsrfToken();

      const userLike: JwtUser = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      } as JwtUser;

      const newAccessToken = this.generateAccessToken(
        userLike.userId,
        userLike.email,
        userLike.role,
      );

      const newRefreshToken = this.generateRefreshToken(
        userLike.userId,
        userLike.email,
        userLike.role,
      );

      //đưa refresh token mới vào redis, với key là userId, value là refresh token, và set expire time trùng với thời gian hết hạn của refresh token
      await this.redis.set(
        `refreshToken:${payload.sub}`,
        this.hashToken(newRefreshToken),
        'EX',
        REFRESH_TOKEN_TIME,
      );

      const isProd = process.env.NODE_ENV === 'production';

      // 3) Set lại cookies
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/v1/auth/refresh-token',
      });

      res.cookie('csrfToken', newCsrfToken, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/v1/auth/refresh-token',
      });

      return {
        accessToken: newAccessToken,
        expiresAt: 900000,
        csrfToken: newCsrfToken,
        tokenType: 'Bearer',
      };
    } catch {
      throw new UnauthorizedException(
        '"Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }
}
