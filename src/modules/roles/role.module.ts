import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { RoleRepository } from './role.repository';

@Module({
  imports: [PrismaModule],
  controllers: [RoleController],
  providers: [RoleService, RoleRepository],
  exports: [RoleService],
})
export class RoleModule {}
