import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ImageBookController } from './image-book.controller';
import { ImageBookService } from './image-book.service';
import { ImageBookRepository } from './image-book.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ImageBookController],
  providers: [ImageBookService, ImageBookRepository],
  exports: [ImageBookService, ImageBookRepository],
})
export class ImageBookModule {}
