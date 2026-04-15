import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { ApiResponse } from 'src/common/api-response';
import { ImageBookService } from './image-book.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BookImageRequestDto } from './dto/book-image.request';
import { UploadFile } from 'src/media/media.service';

@Controller('/v1/book-images')
export class ImageBookController {
  constructor(private readonly imageBookService: ImageBookService) {}

  @Get('')
  async getImages() {
    const images = await this.imageBookService.getImages();
    return ApiResponse.ok(images, 'Lấy danh sách ảnh sách thành công');
  }

  // @Get('/book/:bookId')
  // async getImagesByBookId(@Param('bookId') bookId: string) {
  //   const images = await this.imageBookService.getImagesByBookId(bookId);
  //   return ApiResponse.ok(images, 'Lấy danh sách ảnh theo sách thành công');
  // }

  @Post('')
  @UseInterceptors(
    FilesInterceptor(
      'files',
      10,
      //   {
      //   limits: { fileSize: 1024 * 1024 * 2 }, CÁI NÀY CHẶN Ở TẦNG CAO HƠN
      // }
    ),
  )
  async createImageForBook(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 2,
            message: 'File nặng quá 2MB',
          }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    files: UploadFile[],
    @Body() bookImageDto: BookImageRequestDto,
  ) {
    const requst = await this.imageBookService.createImageForBook(
      bookImageDto,
      files,
    );

    return ApiResponse.ok(requst, 'Upload danh sách ảnh cho sách thành công');
  }

  @Delete()
  async deleteImageByPublicId(@Body('publicId') publicId: string[]) {
    await this.imageBookService.deleteImageByPublicId(publicId);
    return ApiResponse.message('Xóa ảnh sách thành công');
  }

  @Delete(':id')
  async deleteImageById(@Param('id') id: string) {
    await this.imageBookService.deleteImageById(id);
    return ApiResponse.message('Xóa ảnh sách thành công');
  }
}
