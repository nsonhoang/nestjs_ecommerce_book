import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaModule } from 'src/media/media.module';

import { PrismaModule } from 'src/modules/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    MediaModule,
  ],
  exports: [ConfigModule, PrismaModule, MediaModule],
})
export class CoreModule {}
