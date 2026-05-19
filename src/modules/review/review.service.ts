import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { ReviewCreateRequestDto } from './dto/review-create.request.dto';
import { ReviewUpdateRequestDto } from './dto/review-update.request.dto';
import { ReviewResponseDto } from './dto/review.response.dto';
import { OrdersService } from '../orders/orders.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly ordersService: OrdersService,
  ) {}

  async createReview(
    userId: string,
    payload: ReviewCreateRequestDto,
  ): Promise<ReviewResponseDto> {
    try {
      const hasPurchased = await this.ordersService.hasPurchasedBook(
        userId,
        payload.bookId,
      );
      if (!hasPurchased) {
        throw new ForbiddenException(
          'Bạn chỉ có thể đánh giá khi đã mua sản phẩm',
        );
      }

      const existing = await this.reviewRepository.findByUserAndBook(
        userId,
        payload.bookId,
      );
      if (existing) {
        throw new ConflictException('Bạn đã đánh giá sản phẩm này');
      }

      return await this.reviewRepository.create({
        user: { connect: { id: userId } },
        book: { connect: { id: payload.bookId } },
        rating: payload.rating,
        content: payload.content,
      });
    } catch (error) {
      this.logger.error('Failed to create review', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create review');
    }
  }

  async updateReview(
    userId: string,
    reviewId: string,
    payload: ReviewUpdateRequestDto,
  ): Promise<ReviewResponseDto> {
    try {
      const review = await this.reviewRepository.findById(reviewId);
      if (!review) {
        throw new NotFoundException('Review không tồn tại');
      }
      if (review.userId !== userId) {
        throw new ForbiddenException('Bạn không có quyền sửa review này');
      }

      return await this.reviewRepository.updateById(reviewId, {
        rating: payload.rating,
        content: payload.content,
      });
    } catch (error) {
      this.logger.error('Failed to update review', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update review');
    }
  }

  async deleteReview(userId: string, reviewId: string): Promise<void> {
    try {
      const review = await this.reviewRepository.findById(reviewId);
      if (!review) {
        throw new NotFoundException('Review không tồn tại');
      }
      if (review.userId !== userId) {
        throw new ForbiddenException('Bạn không có quyền xóa review này');
      }

      await this.reviewRepository.deleteById(reviewId);
    } catch (error) {
      this.logger.error('Failed to delete review', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete review');
    }
  }

  async getReviewById(reviewId: string): Promise<ReviewResponseDto> {
    try {
      const review = await this.reviewRepository.findById(reviewId);
      if (!review) {
        throw new NotFoundException('Review không tồn tại');
      }
      return review;
    } catch (error) {
      this.logger.error('Failed to get review', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get review');
    }
  }

  async getMyReviewForBook(
    userId: string,
    bookId: string,
  ): Promise<ReviewResponseDto | null> {
    try {
      return await this.reviewRepository.findByUserAndBook(userId, bookId);
    } catch (error) {
      this.logger.error('Failed to get my review', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get my review');
    }
  }

  async getReviewsByBook(
    bookId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    try {
      return await this.reviewRepository.findByBookId(bookId, paginationQuery);
    } catch (error) {
      this.logger.error('Failed to list reviews', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to list reviews');
    }
  }
}
