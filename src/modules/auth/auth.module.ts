////typescript
// filepath: d:\Tuhoc\nestjs e-commerce\src\modules\auth\auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';

import { UserModule } from '../users';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { RedisModule } from '../redis';
import { RoleModule } from '../roles';
import { NotificationsModule } from '../notifications';

import { MailModule } from '../mail';
import { ResetPasswordConfirmStrategy } from 'src/strategies/reset-password.strategy';

@Module({
  imports: [
    PassportModule,
    MailModule,
    RedisModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    UserModule, // ← import UserModule để dùng UserService
    RoleModule, // ← import RoleModule để dùng RoleService
    NotificationsModule, // ← import NotificationsModule để xóa token của user device khi logout và add token mới khi login
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ResetPasswordConfirmStrategy],
  exports: [AuthService], // ← export nếu module khác cần
})
export class AuthModule {}
