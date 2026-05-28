import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BookModule } from '../book/book.module';
import { ShipmentsRepository } from './shipments.repository';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipment.controller';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule, InventoryModule, BookModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentsRepository],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
