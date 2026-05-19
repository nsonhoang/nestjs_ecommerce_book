import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/common/api-response';
import { ReviewService } from './review.service';
import { ReviewCreateRequestDto } from './dto/review-create.request.dto';
import { ReviewUpdateRequestDto } from './dto/review-update.request.dto';
import { ReviewResponseDto } from './dto/review.response.dto';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { type Request } from 'express';
import { type JwtUser } from 'src/strategies/jwt-payload.interface';

@Controller('/v1/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  private static getUserId(req: RequestWithUser): string {
    return req.user.userId;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Req() req: RequestWithUser,
    @Body() payload: ReviewCreateRequestDto,
  ): Promise<ApiResponse<ReviewResponseDto>> {
    const review = await this.reviewService.createReview(
      ReviewController.getUserId(req),
      payload,
    );
    return ApiResponse.ok(review, 'Tạo review thành công');
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Req() req: RequestWithUser,
    @Param('id') reviewId: string,
    @Body() payload: ReviewUpdateRequestDto,
  ): Promise<ApiResponse<ReviewResponseDto>> {
    const review = await this.reviewService.updateReview(
      ReviewController.getUserId(req),
      reviewId,
      payload,
    );
    return ApiResponse.ok(review, 'Cập nhật review thành công');
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(
    @Req() req: RequestWithUser,
    @Param('id') reviewId: string,
  ): Promise<ApiResponse<string>> {
    await this.reviewService.deleteReview(
      ReviewController.getUserId(req),
      reviewId,
    );
    return ApiResponse.ok('Xóa review thành công');
  }

  @Get('/book/:bookId')
  async getReviewsByBook(
    @Param('bookId') bookId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ApiResponse<PaginatedResult<ReviewResponseDto>>> {
    const result = await this.reviewService.getReviewsByBook(bookId, query);
    return ApiResponse.ok(result, 'Lấy danh sách review thành công');
  }

  @Get('/me/:bookId')
  @UseGuards(JwtAuthGuard)
  async getMyReviewForBook(
    @Req() req: RequestWithUser,
    @Param('bookId') bookId: string,
  ): Promise<ApiResponse<ReviewResponseDto | null>> {
    const review = await this.reviewService.getMyReviewForBook(
      ReviewController.getUserId(req),
      bookId,
    );
    return ApiResponse.ok(review, 'Lấy review của bạn thành công');
  }
}

type RequestWithUser = Request & { user: JwtUser };
