// src/modules/ghn/ghn.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GhnService } from './ghn.service';

import { PrismaModule } from '../prisma/prisma.module';
import { GhnRepository } from './ghn.repository';
import { GhnController } from './ghn.controller';
import { ShipmentsModule } from '../shipments/shipments.module';

@Module({
  imports: [
    // Cấu hình HttpModule với Timeout và MaxRedirects
    PrismaModule,
    ShipmentsModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        timeout: 5000, // Đợi tối đa 5s, tránh treo ứng dụng nếu GHN sập
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GhnController],
  providers: [GhnService, GhnRepository],
  exports: [GhnService, GhnRepository], // Cho phép AddressModule sử dụng GhnService
})
export class GhnModule {}
