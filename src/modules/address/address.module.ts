import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';

import { PrismaModule } from '../prisma';
import { AddressRepository } from './address.repository';
import { GhnModule } from '../ghn';

@Module({
  imports: [PrismaModule, GhnModule],
  controllers: [AddressController],
  providers: [AddressService, AddressRepository],
  exports: [AddressService],
})
export class AddressModule {}
