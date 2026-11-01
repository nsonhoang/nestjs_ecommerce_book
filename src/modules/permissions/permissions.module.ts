import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { RedisModule } from '../redis';
import { PermissionsController } from './permissions.controller';
import { PermissionsRepository } from './permissions.repository';
import { PermissionsService } from './permissions.service';

@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsRepository],
  exports: [PermissionsService],
})
export class PermissionsModule {}
