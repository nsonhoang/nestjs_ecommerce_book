import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { minutes, Throttle } from '@nestjs/throttler';

import { ApiResponse } from 'src/common/api-response';
import { BookService } from './book.service';
import { BookRequestDto } from './dto/book.request.dto';
import { BookResponseDto } from './dto/book.response.dto';
import { BookUpdateRequestDto } from './dto/book-update.request.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { PaginateBookDto } from './dto/paginate-book.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from '../roles/roles.enum';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

@ApiTags('Books')
@Controller('/v1/books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @ApiOperation({ summary: 'Lấy danh sách sách' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'authorId', required: false })
  @ApiQuery({ name: 'promotionId', required: false })
  @ApiOkResponse({ description: 'Lấy danh sách sách thành công' })
  @Get('')
  async getBooks(
    @Query() paginationQuery: PaginateBookDto,
  ): Promise<ApiResponse<PaginatedResult<BookResponseDto>>> {
    const books = await this.bookService.getBooks(paginationQuery);
    return ApiResponse.ok(books, 'Lấy danh sách sách thành công');
  }

  @ApiOperation({ summary: 'Lấy sách theo id' })
  @ApiParam({ name: 'id', description: 'Book id' })
  @ApiOkResponse({ description: 'Lấy sách thành công' })
  @Get(':id')
  async getBookById(@Param('id') id: string) {
    const book = await this.bookService.getBookById(id);
    return ApiResponse.ok(book, 'Lấy thông tin sách thành công');
  }

  @ApiOperation({ summary: 'Tạo sách (admin/staff)' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        thumbnail: { type: 'string' },
      },
    },
  })
  @Post('')
  @HttpCode(HttpStatus.CREATED) // Thêm mã 201 cho đúng chuẩn tạo mới
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @UseInterceptors(FileInterceptor('file'))
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  @ApiBearerAuth() // Hiện ổ khóa JWT
  @ApiConsumes('multipart/form-data') // BẮT BUỘC: Đổi giao diện Swagger sang upload file
  @ApiOperation({ summary: 'Tạo mới một cuốn sách (Admin/Staff)' })
  @ApiBody({ type: BookRequestDto }) // Ép Swagger hiển thị form theo BookRequestDto chứa file
  @ApiCreatedResponse({ description: 'Tạo sách thành công.' }) // Đổi từ ApiOk sang ApiCreated (201)
  @ApiBadRequestResponse({
    description:
      'Dữ liệu gửi lên không hợp lệ hoặc File quá lớn, sai định dạng.',
  })
  @ApiForbiddenResponse({
    description:
      'Bạn không có quyền thực hiện hành động này (Yêu cầu Admin/Staff).',
  })
  @ApiTooManyRequestsResponse({
    description: 'Thao tác quá nhanh, vui lòng thử lại sau.',
  })
  async createBook(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
        ],
      }),
    )
    file: any, // Sửa thành kiểu dữ liệu tường minh
    @Body() bookDto: BookRequestDto,
  ): Promise<ApiResponse<BookResponseDto>> {
    // Controller tuân thủ tuyệt đối quy tắc: Không xử lý logic, chuyển tiếp thẳng xuống Service
    const book = await this.bookService.createBook(bookDto, file);
    return ApiResponse.ok(book, 'Thêm sách thành công');
  }

  @ApiOperation({ summary: 'Cập nhật sách (admin/staff)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Book id' })
  @ApiBody({ type: BookUpdateRequestDto })
  @ApiOkResponse({ description: 'Cập nhật sách thành công' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async updateBook(
    @Param('id') id: string,
    @Body() bookDto: BookUpdateRequestDto,
  ): Promise<ApiResponse<BookResponseDto>> {
    const book = await this.bookService.updateBook(id, bookDto);
    return ApiResponse.ok(book, 'Cập nhật sách thành công');
  }

  @ApiOperation({ summary: 'Xóa sách (admin/staff)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Book id' })
  @ApiOkResponse({ description: 'Xóa sách thành công' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async deleteBook(@Param('id') id: string) {
    await this.bookService.deleteBook(id);
    return ApiResponse.message('Xóa sách thành công');
  }
}
