import { Module } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [PrismaModule],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
