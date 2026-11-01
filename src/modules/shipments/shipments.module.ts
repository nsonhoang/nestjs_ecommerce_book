import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma';
import { InventoryModule } from '../inventory';
import { BookModule } from '../book';
import { ShipmentsRepository } from './shipments.repository';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipment.controller';

import { NotificationsModule } from '../notifications';

@Module({
  imports: [PrismaModule, NotificationsModule, InventoryModule, BookModule],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentsRepository],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
