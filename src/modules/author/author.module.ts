import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthorController } from './author.controller';
import { AuthorService } from './author.service';
import { AuthorRepository } from './author.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AuthorController],
  providers: [AuthorService, AuthorRepository],
  exports: [AuthorService, AuthorRepository],
})
export class AuthorModule {}
