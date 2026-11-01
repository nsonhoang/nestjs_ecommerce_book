import { Module } from '@nestjs/common';

import { AuthModule } from './auth';
import { AuthorModule } from './author';
import { BookModule } from './book';
import { CategoryModule } from './categories';
import { ImageBookModule } from './image-book';
import { RoleModule } from './roles';
import { UserModule } from './users';
import { AddressModule } from './address';
import { GhnModule } from './ghn';
import { InventoryModule } from './inventory';
import { CartsModule } from './carts';
import { PromotionModule } from './promotion';
import { OrdersModule } from './orders';
import { VouchersModule } from './vouchers';
import { ShipmentsModule } from './shipments';
import { ReviewModule } from './review';
import { PermissionsModule } from './permissions';
@Module({
  imports: [
    UserModule,
    RoleModule,
    AuthModule,
    BookModule,
    CategoryModule,
    ImageBookModule,
    AuthorModule,
    AddressModule,
    GhnModule,
    InventoryModule,
    CartsModule,
    PromotionModule,
    OrdersModule,
    VouchersModule,
    ShipmentsModule,
    ReviewModule,
    PermissionsModule,
  ],
  exports: [
    UserModule,
    RoleModule,
    AuthModule,
    BookModule,
    CategoryModule,
    ImageBookModule,
    AuthorModule,
    InventoryModule,
    CartsModule,
    PromotionModule,
    OrdersModule,
    VouchersModule,
    ShipmentsModule,
    ReviewModule,
    PermissionsModule,
  ],
})
export class FeatureModulesModule {}
