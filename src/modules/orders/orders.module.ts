import { Module } from '@nestjs/common';
import { BookModule } from '../book';
import { CartsModule } from '../carts';
import { InventoryModule } from '../inventory';
import { PromotionModule } from '../promotion';
import { PrismaModule } from '../prisma';
import { AddressModule } from '../address';
import { VouchersModule } from '../vouchers';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { GhnModule } from '../ghn';
import { ShipmentsModule } from '../shipments';
import { NotificationsModule } from '../notifications';

@Module({
  imports: [
    PrismaModule,
    AddressModule,
    CartsModule,
    InventoryModule,
    PromotionModule,
    VouchersModule,
    GhnModule,
    ShipmentsModule,
    NotificationsModule,
    BookModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
