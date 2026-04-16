import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { AuthorModule } from './author/author.module';
import { BookModule } from './book/book.module';
import { CategoryModule } from './categories/category.module';
import { ImageBookModule } from './image-book/image-book.module';
import { RoleModule } from './roles/role.module';
import { UserModule } from './users/user.module';
import { AddressModule } from './address/address.module';
import { InventoryModule } from './inventory/inventory.module';

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
    InventoryModule,
  ],
  exports: [
    UserModule,
    RoleModule,
    AuthModule,
    BookModule,
    CategoryModule,
    ImageBookModule,
    AuthorModule,
  ],
})
export class FeatureModulesModule {}
