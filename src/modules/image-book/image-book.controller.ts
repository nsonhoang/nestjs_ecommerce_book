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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { minutes, Throttle } from '@nestjs/throttler';

import { ApiResponse } from 'src/common/api-response';
import { ImageBookService } from './image-book.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { BookImageRequestDto } from './dto/book-image.request';
import { UploadFile } from 'src/media/media.service';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from '../roles/roles.enum';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Book Images')
@Controller('/v1/book-images')
export class ImageBookController {
  constructor(private readonly imageBookService: ImageBookService) {}

  @ApiOperation({ summary: 'Lấy danh sách ảnh sách' })
  @ApiOkResponse({ description: 'Lấy danh sách ảnh sách thành công' })
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

  @ApiOperation({ summary: 'Upload ảnh sách (admin/staff)' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        bookId: { type: 'string' },
        position: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({ description: 'Upload ảnh sách thành công' })
  @Post('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @UseInterceptors(
    FilesInterceptor(
      'files',
      10,
      //   {
      //   limits: { fileSize: 1024 * 1024 * 2 }, CÁI NÀY CHẶN Ở TẦNG CAO HƠN
      // }
    ),
  )
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
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

  @ApiOperation({ summary: 'Xóa ảnh sách theo publicId (admin/staff)' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        publicId: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiOkResponse({ description: 'Xóa ảnh sách thành công' })
  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async deleteImageByPublicId(@Body('publicId') publicId: string[]) {
    await this.imageBookService.deleteImageByPublicId(publicId);
    return ApiResponse.message('Xóa ảnh sách thành công');
  }

  @ApiOperation({ summary: 'Xóa ảnh sách theo id (admin/staff)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Book image id' })
  @ApiOkResponse({ description: 'Xóa ảnh sách thành công' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async deleteImageById(@Param('id') id: string) {
    await this.imageBookService.deleteImageById(id);
    return ApiResponse.message('Xóa ảnh sách thành công');
  }
}
