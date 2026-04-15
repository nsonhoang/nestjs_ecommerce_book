import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ImageBookController } from './image-book.controller';
import { ImageBookService } from './image-book.service';
import { ImageBookRepository } from './image-book.repository';
import { MediaModule } from 'src/media/media.module';
import { BookModule } from '../book/book.module';

@Module({
  imports: [PrismaModule, MediaModule, PrismaModule],
  controllers: [ImageBookController],
  providers: [ImageBookService, ImageBookRepository],
  exports: [ImageBookService, ImageBookRepository],
})
export class ImageBookModule {}
