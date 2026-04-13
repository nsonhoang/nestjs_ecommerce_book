import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { BookRepository } from './book.repository';
import { AuthorModule } from '../author/author.module';
import { CategoryModule } from '../categories/category.module';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [PrismaModule, AuthorModule, CategoryModule, MediaModule],
  controllers: [BookController],
  providers: [BookService, BookRepository],
  exports: [BookService, BookRepository],
})
export class BookModule {}
