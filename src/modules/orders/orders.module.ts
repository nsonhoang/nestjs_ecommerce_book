import { Module } from '@nestjs/common';
import { BookModule } from '../book/book.module';
import { CartsModule } from '../carts/carts.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PromotionModule } from '../promotion/promotion.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AddressModule } from '../address/address.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { GhnModule } from '../ghn/ghn.module';
import { ShipmentsModule } from '../shipments/shipments.module';
import { NotificationsModule } from '../notifications/notifications.module';

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
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
