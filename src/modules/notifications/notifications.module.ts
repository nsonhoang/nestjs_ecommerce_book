import { Module } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'notifications-queue',
    }),
  ],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsProcessor,
  ],
  exports: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
