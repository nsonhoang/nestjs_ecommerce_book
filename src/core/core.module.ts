import { Module } from '@nestjs/common';
import { MediaModule } from 'src/media/media.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from 'src/modules/mail/mail.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: 1000,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          { name: 'default', ttl: minutes(1), limit: 120 }, // global mặc định
          { name: 'auth', ttl: minutes(1), limit: 20 }, // group cho auth
        ],
        storage: new ThrottlerStorageRedisService(
          new Redis({
            host: config.get('REDIS_HOST', 'localhost'),
            port: config.get('REDIS_PORT', 6379),
            password: config.get('REDIS_PASSWORD') || undefined,
          }),
        ),
      }),
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    MediaModule,
    NotificationsModule,
    MailModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // GLOBAL
  ],
  exports: [ConfigModule, PrismaModule, MediaModule, NotificationsModule],
})
export class CoreModule {}
