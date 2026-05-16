////typescript
// filepath: d:\Tuhoc\nestjs e-commerce\src\modules\auth\auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';

import { UserModule } from '../users/user.module';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { RedisModule } from '../redis/redis.module';
import { RoleModule } from '../roles/role.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { MailModule } from '../mail/mail.module';
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
    UserModule, // ← import UserModule để dùng UserRepository
    RoleModule, // ← import RoleModule để dùng RoleRepository
    NotificationsModule, // ← import NotificationsModule để xóa token của user device khi logout và add token mới khi login
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ResetPasswordConfirmStrategy],
  exports: [AuthService], // ← export nếu module khác cần
})
export class AuthModule {}
