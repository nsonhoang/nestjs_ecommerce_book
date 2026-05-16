import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthRequestDto } from './dto/auth.request.dto';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.interface';
import { AuthResponse, ResetPasswordPayload } from './auth.interface';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { JwtPayload, JwtUser } from 'src/strategies/jwt-payload.interface';
import { REDIS } from '../redis/redis.module';
import type Redis from 'ioredis';
import { AuthRegisterRequestDto } from './dto/auth-register.request.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthRole } from '../roles/roles.enum';
import { RoleRepository } from '../roles/role.repository';
import { UserService } from '../users/user.service';
import { NotificationsService } from '../notifications/notifications.service';

import { AuthChangePasswordRequestDto } from './dto/auth-change-password.request.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const REFRESH_TOKEN_TIME = 7 * 24 * 60 * 60; // 7 ngày tính theo giây
const MAX_RESET_PASSWORD_REQUEST = 5;
const MAX_VALIDATE_OTP_REQUEST = 5;
const RESET_PASSWORD_TTL = 60 * 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  //gắn thêm deviceId vào token để có thể quản lý thiết bị của user, phục vụ cho việc rate-limit hoặc block thiết bị nếu cần thiết, tránh trường hợp user chia sẻ token cho nhiều người dùng khác nhau
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @InjectQueue('mail_queue') private readonly mailQueue: Queue,
    private readonly userService: UserService, //có thể chuyển thành userService nếu muốn, nhưng do chỉ cần dùng đến hàm findByEmail và createUser nên sẽ không cần thiết phải gọi cả service lên
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
    private readonly roleRepository: RoleRepository,
  ) {}

  //xử lý global exception
  // format response
  //validate role name kh đc trùng

  async login(
    // cần phải thêm upload user device
    authRequest: AuthRequestDto,
    req: Request,
    res: Response, // cái này để set cookie, nhưng sẽ không trả về cho client
  ): Promise<AuthResponse> {
    try {
      const user = await this.validate(authRequest);
      const csrfToken = this.generateCsrfToken();
      const deviceId = this.getDeviceId(req);
      // sử dụng cái pipeline để thực hiện nhiều lệnh Redis trong một lần gọi,
      //  giúp giảm độ trễ và tăng hiệu suất khi cần thực hiện nhiều thao tác liên quan đến token và session
      const loginPipeline = this.redis.pipeline();
      const sessionId = crypto.randomBytes(16).toString('hex'); // set up token có nhiều device đang đăng nhập, đánh dấu  tạo sessionId ngẫu nhiên, có thể dùng thư viện uuid để tạo nếu muốn
      const refreshToken = this.generateRefreshToken(
        user.id,
        user.email,
        user.role.name,
        sessionId,
      );

      const isProd = process.env.NODE_ENV === 'production';
      // set up lại refresh token trong redis, với id là key 1 user chỉ tối đa 5 thiết bị đang nhập, co thêm field là
      // deviceId và ...
      loginPipeline.set(
        `refreshToken:${sessionId}`,
        this.hashToken(refreshToken),
        'EX',
        REFRESH_TOKEN_TIME,
      );
      //này dùng đẻ xác định thiêt bị ,người dùng
      loginPipeline.set(
        `deviceSession:${user.id}:${deviceId}`,
        sessionId,
        'EX',
        REFRESH_TOKEN_TIME,
      );

      const now = Date.now();
      // cái này dùng để sắp sếp các phiên đăng nhâp theo thứ thự có trc có sau,
      // để sau này nếu có session mới nó sẽ dựa nà đây để xóa session cũ hơn
      //  lưu vào sorted set với score là timestamp để có thể quản lý thiết bị theo thời gian đăng nhập
      loginPipeline.zadd(`userDevices:${user.id}`, Number(now), deviceId);

      loginPipeline.expire(`userDevices:${user.id}`, REFRESH_TOKEN_TIME);

      await loginPipeline.exec();

      //giới hạn tối đa 5 thiết bị đang nhập
      const deviceCount = await this.redis.zcard(`userDevices:${user.id}`);
      if (deviceCount > 5) {
        const cleanPipeline = this.redis.pipeline();
        // nếu vượt quá 5 thiết bị, xóa thiết bị cũ nhất (có score nhỏ nhất)
        const oldestDevice = await this.redis.zrange(
          `userDevices:${user.id}`,
          0,
          deviceCount - 6,
        );
        for (const oldestDeviceId of oldestDevice) {
          if (oldestDeviceId) {
            const oldSessionId = await this.redis.get(
              `deviceSession:${user.id}:${oldestDeviceId}`,
            );
            cleanPipeline.del(`refreshToken:${oldSessionId}`); // xóa refresh token của thiết bị cũ
          }
          cleanPipeline.del(`deviceSession:${user.id}:${oldestDeviceId}`);
          cleanPipeline.zrem(`userDevices:${user.id}`, oldestDeviceId);
          await cleanPipeline.exec();
        }
      }
      // set cookie cho refresh token, với httpOnly để không bị truy cập từ JavaScript, secure để chỉ gửi qua HTTPS, sameSite để ngăn chặn CSRF

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd, // Chỉ gửi cookie qua HTTPS
        sameSite: 'lax', // Ngăn chặn CSRF
        maxAge: REFRESH_TOKEN_TIME * 1000, // 7 ngày
        path: '/v1/auth/refresh-token',
      });
      res.cookie('csrfToken', csrfToken, {
        httpOnly: false, // Có thể truy cập từ JavaScript để gửi kèm trong header
        secure: isProd, //để cookie chỉ được gửi qua HTTPS, giúp bảo vệ dữ liệu khỏi bị đánh cắp qua kết nối không an toàn
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_TIME * 1000,
        path: '/v1/auth/refresh-token', // Đảm bảo cookie được gửi cho tất cả các endpoint
      });

      // upload user device
      if (authRequest.fcmToken && authRequest.deviceOs) {
        await this.notificationsService.saveDeviceToken(
          user.id,
          authRequest.fcmToken,
          authRequest.deviceOs,
        );
      }

      return {
        accessToken: this.generateAccessToken(
          user.id,
          user.email,
          user.role.name,
          sessionId,
        ),
        expiresAt: 900000, // 15 phút
        // Tạo CSRF token và gửi về client,
        csrfToken: csrfToken,
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

  async register(
    userRegisterDto: AuthRegisterRequestDto,
  ): Promise<UserResponseDto> {
    try {
      const existingUser = await this.userService.getUserByEmail(
        userRegisterDto.email,
      );
      if (existingUser) {
        throw new BadRequestException('Email đã được sử dụng');
      }

      const role = await this.roleRepository.findByName(AuthRole.USER);
      if (!role) {
        this.logger.error(`Role ${AuthRole.USER} not found in database`);
        throw new NotFoundException(`Role ${AuthRole.USER} not found`);
      }

      return this.userService.createUser({
        email: userRegisterDto.email,
        password: userRegisterDto.password,
        name: userRegisterDto.name,
        phone: userRegisterDto.phone,
        roleId: role.id,
      });
    } catch (error) {
      this.logger.error('Failed to register user', error);
      throw new BadRequestException(
        'Đăng ký thất bại: ' +
          (error instanceof Error ? error.message : 'Lỗi không xác định'),
      );
    }
  }

  async refreshToken(
    csrfToken: string,
    res: Response,
    req: Request,
  ): Promise<AuthResponse> {
    try {
      // 1) Verify refresh token
      const refreshToken = req.cookies?.refreshToken as string | undefined;
      const csrfCookie = req.cookies?.csrfToken as string | undefined;
      const deviceId = this.getDeviceId(req);

      if (!refreshToken)
        throw new UnauthorizedException('Không tìm thấy refresh token');
      if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
        throw new ForbiddenException('CSRF token không hợp lệ');
      }

      const payload: JwtPayload = await this.jwtService.verify(refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          process.env.JWT_SECRET ||
          'your-secret-key',
      });

      const storedHash = await this.redis.get(
        `refreshToken:${payload.sessionId}`,
      );
      const incomingHash = this.hashToken(refreshToken);

      if (!storedHash || storedHash !== incomingHash) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      // kiểm tra sessionId có hợp lệ không
      const validSessionId = await this.redis.get(
        `deviceSession:${payload.sub}:${deviceId}`,
      );
      if (!validSessionId || validSessionId !== payload.sessionId) {
        throw new UnauthorizedException('Phiên làm việc không hợp lệ');
      }

      // cái này nó vẫn giữ lại sesionID cũ, đáng là phải cấp mới
      await this.redis.del(`refreshToken:${payload.sessionId}`); // Xóa refresh token cũ sau khi đã xác thực thành công
      //Xóa session cũ để tránh bị rò rỉ token cũ vẫn còn hiệu lực,
      //  nếu có thiết bị nào đó đang sử dụng refresh token cũ thì sẽ bị mất hiệu lực ngay lập tức

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
        payload.sessionId,
      );

      const newRefreshToken = this.generateRefreshToken(
        userLike.userId,
        userLike.email,
        userLike.role,
        payload.sessionId,
      );

      //đưa refresh token mới vào redis, với key là userId, value là refresh token,
      // và set expire time trùng với thời gian hết hạn của refresh token
      await this.redis.set(
        `refreshToken:${payload.sessionId}`,
        this.hashToken(newRefreshToken),
        'EX',
        REFRESH_TOKEN_TIME,
      );

      // Cập nhật lại sessionId trong Redis để đảm bảo đồng bộ với refresh token mới, này tưng tự trên để xác đinh thiết bị
      const setResult = await this.redis.set(
        `deviceSession:${userLike.userId}:${deviceId}`,
        payload.sessionId,
        'EX',
        REFRESH_TOKEN_TIME,
        'XX', // Chỉ set nếu key đã tồn tại, tránh trường hợp refresh token bị đánh cắp mà tạo được session mới
      ); // gia hạn session cũ thêm 7 ngày, nếu muốn cấp mới sessionId thì phải xóa session cũ đi và tạo session mới với sessionId mới, nhưng

      if (!setResult) {
        //nếu lỗi thì phải cóa refresh token mới trong redis đi nếu không bộ hớ đấy sẽ bị rác redis
        await this.redis.del(`refreshToken:${payload.sessionId}`);
        throw new UnauthorizedException('Phiên làm việc không hợp lệ');
      }

      await this.redis.zadd(
        `userDevices:${userLike.userId}`,
        Number(Date.now()),
        deviceId,
      ); // Cập nhật timestamp trong sorted set để quản lý thiết bị theo thời gian đăng nhập
      console.log(
        'đã cập nhật session mới và device mới sau khi refresh token thành công',
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
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  async logout(
    accessToken: string,
    request: Request,
    fcmToken?: string,
  ): Promise<string> {
    // cần phải thêm xóa user device
    try {
      // 2) Xóa refresh token trong Redis dựa trên userId lấy được từ access token
      const payload: JwtPayload = this.verifyToken(accessToken);
      console.log('Logout payload:', payload); // Debug: log payload
      //lấy sessionId theo deviceId để xóa refresh token, tránh trường hợp user đăng xuất trên một thiết bị nhưng lại xóa luôn refresh token của các thiết bị khác
      const sessionId = await this.redis.get(
        `deviceSession:${payload.sub}:${this.getDeviceId(request)}`,
      );

      const currentSessionId = await this.redis.get(
        `deviceSession:${payload.sub}:${this.getDeviceId(request)}`,
      );
      if (!currentSessionId) {
        this.logger.warn(
          `Không tìm thấy sessionId cho người dùng ${payload.sub} trên thiết bị ${this.getDeviceId(request)} khi đăng xuất
          có thể thiết bị đã bị thay đổi thông tin 
          `,
        );
        throw new UnauthorizedException(
          'Không tìm thấy sessionId cho thiết bị, có thể thiết bị đã bị thay đổi thông tin',
        );
      }
      if (sessionId) {
        await this.redis.del(`refreshToken:${sessionId}`);
      }

      //phải kiểm tra xem deviceId có đúng với trong redis không trước khi xóa,
      // để tránh xóa dữ liệu rác trên thiết bị
      await this.redis.del(
        `deviceSession:${payload.sub}:${this.getDeviceId(request)}`,
      );
      await this.redis.zrem(
        `userDevices:${payload.sub}`,
        this.getDeviceId(request),
      );

      this.logger.log(
        `Đã xóa session và device cho user ${payload.sub} trên thiết bị ${this.getDeviceId(request)}`,
      ); // Debug: log thông tin đã xóa session và device
      // 3) Có thể thêm blacklist cho access token nếu muốn, nhưng do access token có thời gian sống ngắn nên có thể không cần thiết
      const now = Math.floor(Date.now() / 1000);
      const ttl = payload.exp - now;
      const hashAccessToken = this.hashToken(accessToken);
      await this.redis.set(
        `blacklist:${hashAccessToken}`,
        'true',
        'EX',
        Math.max(0, ttl),
      ); // Blacklist access token là thời gian sống còn lại của access token, có thể lấy từ payload.exp - hiện tại
      if (fcmToken) {
        this.notificationsService.removeDeviceToken(fcmToken).catch((error) => {
          this.logger.error(
            `Failed to remove device token ${fcmToken} during logout:`,
            error,
          );
        });
      }
    } catch (error) {
      this.logger.error('Failed to logout', error);
      throw new UnauthorizedException(
        'Đăng xuất thất bại: ' +
          (error instanceof Error ? error.message : 'Lỗi không xác định'),
      );
    }
    return 'đăng xuất thành công';
  }
  // tiếp theo sẽ xây dựng hàm đổi mật khẩu, quên mật khẩu và cải tiến hàm đăng kí tài khoản ,
  async changePassword(
    data: AuthChangePasswordRequestDto,
    jwtUser: JwtUser,
  ): Promise<string> {
    const myProfile = await this.userService.getProfile(jwtUser); // láy email

    const { password } = (await this.userService.getUserByEmail(
      myProfile.email,
    ))!;
    // kiểm tra xem mật khẩu cũ có đúng không

    const isMatch = await this.matchPassword(password, data.oldPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu cũ không đúng');
    }
    //đổi mật khẩu đã yêu cầu asscess token rồi nên kh phải xác thực otp nữa
    const result = await this.userService.changePassword(
      jwtUser.userId,
      data.newPassword,
    );
    if (!result) {
      throw new BadRequestException('Không thể đổi mật khẩu');
    }

    return 'Đổi mật khẩu thành công';
  }

  //reset password
  async resetPassword(email: string): Promise<string> {
    // kiểm tra xem email có tồn tại trong hệ thống không
    // nếu có thì tạo mã OTP và token để xác thực khi reset password, sau đó gửi mail cho user
    // rate limit cho endpoint này để tránh bị spam, có thể \
    // dùng Redis để lưu số lần yêu cầu reset password của mỗi email,
    //  nếu vượt quá giới hạn thì block trong một khoảng thời gian nhất định
    // tạo 1 cái id ngẫu nhiên để làm path cho cho link xác thực otp
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException(
        'Không tìm thấy người dùng với email ' + email,
      );
    }

    //rate limit cho email này
    const requestCount = await this.redis.incr(`resetPassword:${email}`);
    if (requestCount === 1) {
      await this.redis.expire(`resetPassword:${email}`, RESET_PASSWORD_TTL); // reset password request có thời gian sống 1 giờ
    }
    if (requestCount > MAX_RESET_PASSWORD_REQUEST) {
      throw new BadRequestException(
        'Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau 1 giờ.',
      );
    }

    const otp = this.generateOTP();
    const otpToken = this.generateOTPToken();
    // chỉ cần 1 otp thôi
    const redisKey = `otp_verify:${otpToken}:${otp}`;
    await this.redis.set(redisKey, user.email, 'EX', 300); // OTP có thời gian sống 5 phút
    // OTP token có thời gian sống 5 phút, dùng để xác thực khi người dùng click vào link trong mail,
    //  nếu token hợp lệ thì mới cho phép nhập OTP,
    // tránh trường hợp bị lộ email và bị người khác gửi mã OTP về email của mình để chiếm đoạt tài khoản,
    // vì nếu không có token thì vẫn có thể gửi mã OTP về email của mình nhưng sẽ không thể xác thực được khi click
    //  vào link trong mail để nhập OTP, nên sẽ không thể chiếm đoạt được tài khoản

    // await this.redis.set(`otpToken:${user.email}`, otpToken, 'EX', 5 * 60);

    // kiểm tra xem trong 5 phút qua có bao nhiêu lần yêu cầu reset password từ email này,
    //  nếu quá 5 lần thì sẽ block trong 1 giờ, để tránh bị spam

    await this.mailQueue.add('send-reset-password-mail', {
      to: email,
      otp: otp,
      token: otpToken,
    });
    return otpToken; // trả về token để client có thể dùng làm path khi click vào link trong mail,
  }

  async verifyResetPasswordToken(
    otp: string,
    otpToken: string,
  ): Promise<string> {
    // trả về 1 token chứa trong đó cho email làm payload, token này có thời gian sống ngắn khoảng 15 phút, để đảm bảo xác thực mật khẩu mới
    const email = await this.validateOTP(otp, otpToken);

    return this.generateResetToken(email);
  }

  async resetPasswordWithToken(
    newPassword: string,
    email: string,
  ): Promise<string> {
    try {
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        throw new NotFoundException(
          'Không tìm thấy người dùng với email ' + email,
        );
      }
      await this.userService.changePassword(user.id, newPassword);
      return 'Đặt lại mật khẩu thành công';
    } catch (error) {
      this.logger.error('Failed to reset password with token', error);
      throw new BadRequestException(
        'Đặt lại mật khẩu thất bại: ' +
          (error instanceof Error ? error.message : 'Lỗi không xác định'),
      );
    }
  }
  // validate otp
  private async validateOTP(otp: string, otpToken: string): Promise<string> {
    const countValidate = await this.redis.incr(`validateOTP:${otpToken}`);
    if (countValidate > MAX_VALIDATE_OTP_REQUEST) {
      // xóa luôn cái otp đấy cho khỏi spam
      await this.redis.del(`otp_verify:${otpToken}:${otp}`);
      await this.redis.del(`validateOTP:${otpToken}`);

      throw new BadRequestException(
        'Bạn đã xác thực OTP quá nhiều lần. Vui lòng thử lại sau.',
      );
    }
    const emailValue = `otp_verify:${otpToken}:${otp}`;
    const email = await this.redis.get(emailValue);
    if (!email) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }
    return email;
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Tạo mã OTP 6 chữ số
  }

  //cái này để làm path
  private generateOTPToken(): string {
    return crypto.randomBytes(32).toString('hex'); // Tạo token ngẫu nhiên để xác thực OTP, có thể dùng thư viện uuid nếu muốn
  }

  //cái này dùng để xác thực sau khi xác nhận otp xong
  private generateResetToken(email: string): string {
    //cái này chứa pauload là email;

    return this.jwtService.sign(
      { email: email, type: 'reset-password' }, // có thể thêm thông tin khác vào payload nếu muốn, nhưng do token này chỉ dùng để xác thực khi reset password nên chỉ cần email là đủ, và email này sẽ được mã hóa trong token để tránh bị lộ thông tin
      {
        secret:
          process.env.JWT_RESET_PASSWORD_SECRET ||
          process.env.JWT_SECRET ||
          'your-secret-key',
        expiresIn: '15m', // Token có thời gian sống 15 phút, đủ để người dùng check mail và nhập OTP
      },
    );
  }

  private async validate(authRequest: AuthRequestDto): Promise<User> {
    const user = await this.userService.getUserByEmail(authRequest.email);

    if (!user) {
      throw new NotFoundException(
        'Không tìm thấy người dùng với email ' + authRequest.email,
      );
    }
    const isMatch = await this.matchPassword(
      user.password,
      authRequest.password,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không đúng');
    }
    return user;
  }

  private async matchPassword(
    userPassword: string,
    currentPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(currentPassword, userPassword);
  }

  private getDeviceId(request: Request): string {
    //
    const deviceIdFromHeader = request.headers['x-device-id'] as string;
    if (!deviceIdFromHeader) {
      this.logger.warn(
        'Không tìm thấy header x-device-id, sử dụng deviceId mặc định',
      );
      throw new BadRequestException(
        'Thiếu header x-device-id để định danh thiết bị',
      );
    }

    if (deviceIdFromHeader && deviceIdFromHeader.trim().length > 0) {
      return deviceIdFromHeader.trim();
    }
    // bắt buộc phải có deviceID
    // client phải bắt buộc gửi header x-device-id để định danh thiết bị, nếu không có thì sẽ tạo một deviceId ngẫu nhiên, nhưng như vậy sẽ không thể quản lý được thiết bị của user, nên tốt nhất là yêu cầu client phải gửi header này khi login
    return deviceIdFromHeader;
  }

  private generateAccessToken(
    userId: string,
    email: string,
    role: string,
    sessionId: string, // có thể thêm sessionId vào payload nếu muốn, nhưng do access token có thời gian sống ngắn nên có thể không cần thiết
  ): string {
    return this.jwtService.sign({
      sub: userId,
      email: email,
      role: role,
      sessionId: sessionId,
    });
  }

  private generateRefreshToken(
    userId: string,
    email: string,
    role: string,
    sessionId: string,
  ): string {
    return this.jwtService.sign(
      {
        sub: userId,
        email: email,
        role: role,
        sessionId: sessionId,
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

  private verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          process.env.JWT_SECRET ||
          'your-secret-key',
      });
    } catch (error) {
      this.logger.error('Failed to verify token', error);
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }
}
