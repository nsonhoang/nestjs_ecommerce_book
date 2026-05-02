import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ShipmentsRepository } from './shipments.repository';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipment.controller';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentsRepository],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
