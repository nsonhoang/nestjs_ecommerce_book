import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { BookRepository } from './book.repository';
import { BookOrderEventListener } from './listeners/order-events.listener';
import { AuthorModule } from '../author';
import { CategoryModule } from '../categories';
import { MediaModule } from 'src/media/media.module';
import { ImageBookModule } from '../image-book';

@Module({
  imports: [
    PrismaModule,
    AuthorModule,
    CategoryModule,
    MediaModule,
    ImageBookModule,
  ],
  controllers: [BookController],
  providers: [BookService, BookRepository, BookOrderEventListener],
  exports: [BookService],
})
export class BookModule {}
