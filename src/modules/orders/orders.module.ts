import { Module } from '@nestjs/common';
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
import { OrderSagaOrchestrator } from './sagas/order-saga.orchestrator';
import { ApplyVoucherStep } from './sagas/steps/apply-voucher.step';
import { ReserveInventoryStep } from './sagas/steps/reserve-inventory.step';
import { CreateOrderRecordStep } from './sagas/steps/create-order-record.step';

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
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    OrderSagaOrchestrator,
    ApplyVoucherStep,
    ReserveInventoryStep,
    CreateOrderRecordStep,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
