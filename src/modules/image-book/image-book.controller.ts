import { Controller, Get, Param } from '@nestjs/common';

import { ApiResponse } from 'src/common/api-response';
import { ImageBookService } from './image-book.service';

@Controller('/v1/book-images')
export class ImageBookController {
  constructor(private readonly imageBookService: ImageBookService) {}

  @Get('')
  async getImages() {
    const images = await this.imageBookService.getImages();
    return ApiResponse.ok(images, 'Lấy danh sách ảnh sách thành công');
  }

  @Get('/book/:bookId')
  async getImagesByBookId(@Param('bookId') bookId: string) {
    const images = await this.imageBookService.getImagesByBookId(bookId);
    return ApiResponse.ok(images, 'Lấy danh sách ảnh theo sách thành công');
  }
}
