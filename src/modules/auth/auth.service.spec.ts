/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { JwtService } from '@nestjs/jwt';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { AuthService } from './auth.service';
import { Test, type TestingModule } from '@nestjs/testing';
import { REDIS } from '../redis/redis.module';
import { UserService } from '../users/user.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RoleRepository } from '../roles/role.repository';

// Important: AuthService imports modules that depend on Prisma.
// For unit tests, mock them so Jest doesn't load the Prisma generated client.
jest.mock('../users/user.service', () => ({
  UserService: class UserService {},
}));
jest.mock('../roles/role.repository', () => ({
  RoleRepository: class RoleRepository {},
}));
jest.mock('../notifications/notifications.service', () => ({
  NotificationsService: class NotificationsService {},
}));

describe('AuthService (unit)', () => {
  let service: AuthService;
  let moduleRef: TestingModule;

  let redis: any;
  let mailQueue: any;
  let userService: any;
  let notificationsService: any;
  let roleRepository: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    const pipeline = {
      set: jest.fn(),
      zadd: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
      zrem: jest.fn(),

      exec: jest.fn().mockImplementation(() => Promise.resolve([])),
    };

    redis = {
      pipeline: jest.fn().mockReturnValue(pipeline),
      zcard: jest.fn().mockImplementation(() => Promise.resolve(1)),
      zrange: jest.fn().mockImplementation(() => Promise.resolve([])),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      zadd: jest.fn(),
      expire: jest.fn(),
      zrem: jest.fn(),
      incr: jest.fn(),
    };

    mailQueue = { add: jest.fn() };
    userService = { getUserByEmail: jest.fn(), createUser: jest.fn() };
    notificationsService = {
      saveDeviceToken: jest.fn(),
      removeDeviceToken: jest.fn().mockImplementation(() => Promise.resolve()),
    };
    roleRepository = { findByName: jest.fn() };
    jwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    } as unknown as JwtService;

    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: REDIS, useValue: redis },
        { provide: getQueueToken('mail_queue'), useValue: mailQueue },
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: RoleRepository, useValue: roleRepository },
      ],
    }).compile();

    service = moduleRef.get(AuthService);

    // Silence logs in unit tests
    (service as any).logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    await moduleRef?.close();
  });

  it('logs in: stores refresh/session/device, sets cookies, returns access token', async () => {
    jest.spyOn(service as any, 'validate').mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: { name: 'USER' },
      password: 'hashed',
    });

    jest
      .spyOn(service as any, 'generateCsrfToken')
      .mockReturnValue('csrf-token');
    jest
      .spyOn(service as any, 'generateRefreshToken')
      .mockReturnValue('refresh-token-raw');
    jest
      .spyOn(service as any, 'generateAccessToken')
      .mockReturnValue('access-token');

    const req = {
      headers: {
        'x-device-id': 'device-1',
      },
    } as any;

    const res = {
      cookie: jest.fn(),
    } as any;

    const result = await service.login(
      {
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        fcmToken: 'fcm-token',
        deviceOs: 'android',
      },
      req,
      res,
    );

    // Redis pipeline writes
    const pipeline = redis.pipeline.mock.results[0].value;
    expect(redis.pipeline).toHaveBeenCalledTimes(1);

    // sessionId is random -> assert key pattern and hashed value shape
    const refreshSetCall = pipeline.set.mock.calls.find((c: any[]) =>
      String(c[0]).startsWith('refreshToken:'),
    );
    expect(refreshSetCall).toBeTruthy();
    expect(refreshSetCall[1]).toMatch(/^[a-f0-9]{64}$/);
    expect(refreshSetCall[2]).toBe('EX');
    expect(refreshSetCall[3]).toBe(7 * 24 * 60 * 60);

    const deviceSessionCall = pipeline.set.mock.calls.find((c: any[]) =>
      String(c[0]).startsWith('deviceSession:user-1:device-1'),
    );
    expect(deviceSessionCall).toBeTruthy();
    expect(deviceSessionCall[2]).toBe('EX');
    expect(deviceSessionCall[3]).toBe(7 * 24 * 60 * 60);

    expect(pipeline.zadd).toHaveBeenCalledWith(
      'userDevices:user-1',
      expect.any(Number),
      'device-1',
    );
    expect(pipeline.expire).toHaveBeenCalledWith(
      'userDevices:user-1',
      7 * 24 * 60 * 60,
    );
    expect(pipeline.exec).toHaveBeenCalledTimes(1);

    // Cookies
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token-raw',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/v1/auth/refresh-token',
      }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'csrfToken',
      'csrf-token',
      expect.objectContaining({
        httpOnly: false,
        sameSite: 'lax',
        path: '/v1/auth/refresh-token',
      }),
    );

    // Device token stored
    expect(notificationsService.saveDeviceToken).toHaveBeenCalledWith(
      'user-1',
      'fcm-token',
      'android',
    );

    // Response
    expect(result).toEqual({
      accessToken: 'access-token',
      expiresAt: 900000,
      csrfToken: 'csrf-token',
      tokenType: 'Bearer',
    });
  });

  it('ném ra lỗi khi không cung cấp x-device-id header', async () => {
    jest.spyOn(service as any, 'validate').mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: { name: 'USER' },
    });

    await expect(
      service.login(
        { email: 'test@example.com', password: 'P@ssw0rd!' },
        { headers: {} } as any,
        { cookie: jest.fn() } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  // test register, logout, refresh token, etc. would go here
  it(' khi đăng kí với email đã tồn tại thì sẽ ném lỗi', async () => {
    userService.getUserByEmail.mockResolvedValue({
      email: 'test@example.com',
    });

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        confirmPassword: 'P@ssw0rd!',
        name: 'Test User',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('kiểm tra khi email gửi đến hàm đăng kí quá nhiều lần trong một khoảng thời gian ngắn thì sẽ ném lỗi', async () => {
    userService.getUserByEmail.mockResolvedValue(null);
    redis.incr.mockResolvedValue(6);

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        confirmPassword: 'P@ssw0rd!',
        name: 'Test User',
      }),
    ).rejects.toBeInstanceOf(HttpException);

    try {
      await service.register({
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        confirmPassword: 'P@ssw0rd!',
        name: 'Test User',
      });
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    expect(mailQueue.add).not.toHaveBeenCalled();
  });

  it('register: tạo OTP + lưu redis + enqueue mail_queue', async () => {
    userService.getUserByEmail.mockResolvedValue(null);
    redis.incr.mockResolvedValue(1);

    redis.expire.mockResolvedValue(1);
    redis.set.mockResolvedValue('OK');
    mailQueue.add.mockResolvedValue(undefined);

    jest.spyOn(service as any, 'generateOTP').mockReturnValue('123456');
    jest.spyOn(service as any, 'generateOTPToken').mockReturnValue('otp-token');

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        confirmPassword: 'P@ssw0rd!',
        name: 'Test User',
      }),
    ).resolves.toBe('otp-token');

    expect(redis.expire).toHaveBeenCalledWith(
      'registerEmail:test@example.com',
      300,
    );

    expect(redis.set).toHaveBeenCalledWith(
      'otp_verify:otp-token:123456',
      'test@example.com',
      'EX',
      300,
    );
    expect(redis.set).toHaveBeenCalledWith(
      'user-pending:otp-token',
      expect.any(String),
      'EX',
      300,
    );

    expect(mailQueue.add).toHaveBeenCalledWith('send-mail-verify-email', {
      to: 'test@example.com',
      otp: '123456',
      token: 'otp-token',
    });
  });

  it('logout: xóa session + zrem device + blacklist access token', async () => {
    const accessToken = 'access-token';
    const deviceId = 'device-1';
    const sessionId = 'session-1';
    const fcmToken = 'fcm-token';

    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const nowSec = 1_700_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(nowSec * 1000);

    jest.spyOn(jwtService, 'verify').mockReturnValue({
      sub: 'user-1',
      exp: nowSec + 120,
    } as any);

    redis.get
      .mockResolvedValueOnce(sessionId) // sessionId
      .mockResolvedValueOnce(sessionId); // currentSessionId

    redis.del.mockResolvedValue(1);
    redis.zrem.mockResolvedValue(1);
    redis.set.mockResolvedValue('OK');

    jest.spyOn(service as any, 'hashToken').mockReturnValue('hash');

    await expect(
      service.logout(
        accessToken,
        { headers: { 'x-device-id': deviceId } } as any,
        fcmToken,
      ),
    ).resolves.toBe('đăng xuất thành công');

    expect(redis.get).toHaveBeenNthCalledWith(
      1,
      `deviceSession:user-1:${deviceId}`,
    );
    expect(redis.get).toHaveBeenNthCalledWith(
      2,
      `deviceSession:user-1:${deviceId}`,
    );
    expect(redis.del).toHaveBeenCalledWith(`refreshToken:${sessionId}`);
    expect(redis.del).toHaveBeenCalledWith(`deviceSession:user-1:${deviceId}`);
    expect(redis.zrem).toHaveBeenCalledWith(`userDevices:user-1`, deviceId);

    expect(redis.set).toHaveBeenCalledWith('blacklist:hash', 'true', 'EX', 120);

    expect(notificationsService.removeDeviceToken).toHaveBeenCalledWith(
      fcmToken,
    );
  });

  it('logout: ném Unauthorized nếu không tìm thấy sessionId theo device', async () => {
    const accessToken = 'access-token';
    const deviceId = 'device-1';

    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    jest.spyOn(jwtService, 'verify').mockReturnValue({
      sub: 'user-1',
      exp: Math.floor(Date.now() / 1000) + 120,
    } as any);

    redis.get
      .mockResolvedValueOnce(null) // sessionId
      .mockResolvedValueOnce(null); // currentSessionId

    await expect(
      service.logout(accessToken, {
        headers: { 'x-device-id': deviceId },
      } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(redis.del).not.toHaveBeenCalledWith(
      expect.stringMatching(/^refreshToken:/),
    );
  });

  // test case xác thực otp đăng kí
  it('kiểm tra xem otpToken có đúng chưa', async () => {
    const otpToken = 'otp-token';
    const otp = '123456';

    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);

    redis.get.mockResolvedValueOnce('test@example.com').mockResolvedValueOnce(
      JSON.stringify({
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        confirmPassword: 'P@ssw0rd!',
        name: 'Test User',
        phone: null,
      }),
    ); // user-pending:otp-token

    roleRepository.findByName.mockResolvedValue({ id: 'role-1', name: 'USER' });
    userService.createUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: { name: 'USER' },
    });

    await expect(
      service.confirmEmailRegistration(otp, otpToken),
    ).resolves.toMatchObject({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: { name: 'USER' },
    });

    expect(redis.del).toHaveBeenCalledWith(`otp_verify:${otpToken}:${otp}`);
    expect(redis.del).toHaveBeenCalledWith(`validateOTP:${otpToken}`);
    expect(redis.del).toHaveBeenCalledWith(`user-pending:${otpToken}`);
  });

  it('xác thực otp đăng kí: ném lỗi nếu otp hoặc otpToken không đúng', async () => {
    const otpToken = 'otp-token';
    const otp = '123456';

    redis.get.mockResolvedValueOnce(null); // otp_verify:otp-token:123456
    await expect(
      service.confirmEmailRegistration(otp, otpToken),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

// id!: string;
// email!: string;
// name!: string | null;
// phone!: string | null;
// createdAt!: Date;
// updatedAt!: Date;
// role!: RolesResponseDto;
// addresses?: AddressResponseDTO[];
