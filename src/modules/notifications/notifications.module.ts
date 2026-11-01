import { Module } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

import { PrismaModule } from '../prisma';
import { NotificationsController } from './notifications.controller';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsOrderEventListener } from './listeners/order-events.listener';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'notifications-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
  ],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsProcessor,
    NotificationsOrderEventListener,
  ],
  exports: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
