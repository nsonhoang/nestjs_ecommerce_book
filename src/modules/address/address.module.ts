import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { AddressRepository } from './address.repository';
import { GhnModule } from '../ghn/ghn.module';

@Module({
  imports: [PrismaModule, GhnModule],
  controllers: [AddressController],
  providers: [AddressService, AddressRepository],
  exports: [AddressService],
})
export class AddressModule {}
