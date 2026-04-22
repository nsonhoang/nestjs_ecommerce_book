import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { AddressRepository } from './address.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AddressController],
  providers: [AddressService, AddressRepository],
  exports: [AddressService],
})
export class AddressModule {}
