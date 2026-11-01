import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';

import { PrismaModule } from '../prisma';
import { CartRepository } from './carts.repository';
import { CartsOrderEventListener } from './listeners/order-events.listener';

@Module({
  imports: [PrismaModule],
  controllers: [CartsController],
  providers: [CartsService, CartRepository, CartsOrderEventListener],
  exports: [CartsService],
})
export class CartsModule {}
