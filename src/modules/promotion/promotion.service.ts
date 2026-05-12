import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PromotionRepository } from './promotion.repository';
import { PromotionRequestDto } from './dto/promotion.request.dto';
import { PromotionResponseDto } from './dto/promotion.response';
import { PromotionUpdateRequestDto } from './dto/promotion-update.request.dto';
import { PaginatePromotionDto } from './dto/pagination-promotion.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(
    private readonly promotionRepository: PromotionRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createPromotion(
    promotionData: PromotionRequestDto,
  ): Promise<PromotionResponseDto> {
    //kiểm tra ngày bắt đầu phải lơn hơn ngày hiện tại
    const now = new Date();
    const startDate = new Date(promotionData.startDate);
    const endDate = new Date(promotionData.endDate);
    // sử lí ngày tháng kết thúc phải sau ngày bắt đầu

    if (promotionData.discountRate < 1 || promotionData.discountRate > 100) {
      throw new BadRequestException('Mức giảm phải từ 1% đến 100%');
    }
    if (endDate < now) {
      throw new BadRequestException('Ngày kết thúc phải lớn hơn ngày hiện tại');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }

    if (endDate > startDate && startDate < now) {
      throw new BadRequestException('Ngày bắt đầu phải lớn hơn ngày hiện tại');
    }

    return this.promotionRepository.create(promotionData);
  }

  //admin gửi thông báo cho sales cho người dùng về chương trình khuyến mãi
  async sendPromotionNotification(
    title: string,
    body: string,
    promotionId: string,
  ) {
    const promotion = await this.promotionRepository.findById(promotionId);
    if (!promotion) {
      throw new NotFoundException(
        `Không tìm thấy chương trình khuyến mãi với ID: ${promotionId}`,
      );
    }
    // gửi thông báo đến topic "sales" để tất cả người dùng đã subscribe vào topic này sẽ nhận được thông báo về chương trình khuyến mãi mới
    await this.notificationsService.sendNotificationToTopic(
      'sales', // ,mặc định gửi vào sales
      title,
      body,
    );
  }

  async getAllPromotions(
    query: PaginatePromotionDto,
  ): Promise<PaginatedResult<PromotionResponseDto>> {
    return this.promotionRepository.findAll(query);
  }

  async getPromotionById(id: string): Promise<PromotionResponseDto | null> {
    const promotion = await this.promotionRepository.findById(id);
    if (!promotion) {
      throw new NotFoundException(
        `Không tìm thấy chương trình khuyến mãi với ID: ${id}`,
      );
    }
    return promotion;
  }

  async deletePromotion(id: string): Promise<void> {
    const promotion = await this.promotionRepository.findById(id);
    if (!promotion) {
      throw new NotFoundException(
        `Không tìm thấy chương trình khuyến mãi với ID: ${id}`,
      );
    }
    await this.promotionRepository.delete(id);
  }

  async updatePromotion(
    id: string,
    promotionData: PromotionUpdateRequestDto,
  ): Promise<PromotionResponseDto> {
    // thêm sách

    // sửa thông tin chương trình khuyến mãi

    // sửa thông tin chương trình khuyến mãi
    const existingPromotion = await this.promotionRepository.findById(id);
    if (!existingPromotion) {
      throw new NotFoundException(
        `Không tìm thấy chương trình khuyến mãi với ID: ${id}`,
      );
    }

    // nếu có sửa đổi thời gian bắt đầu và kết thúc thì phải kiểm tra lại
    const finalStartDate = promotionData.startDate
      ? new Date(promotionData.startDate)
      : existingPromotion.startDate;
    const finalEndDate = promotionData.endDate
      ? new Date(promotionData.endDate)
      : existingPromotion.endDate;
    const now = new Date();
    // 2. Kiểm tra Logic bắt buộc (Luôn luôn đúng)
    if (finalEndDate <= finalStartDate) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }

    // 3. Kiểm tra Ngày Kết Thúc (Không được kết thúc ở quá khứ)
    // Dù là gia hạn hay tạo mới, ngày kết thúc luôn phải ở Tương lai hoặc Hiện tại
    if (finalEndDate < now) {
      throw new BadRequestException(
        'Ngày kết thúc không được nằm trong quá khứ',
      );
    }

    // 4. Kiểm tra Ngày Bắt Đầu (Lọc riêng trường hợp đặc biệt)
    // CHỈ check lỗi này nếu Admin THỰC SỰ MUỐN ĐỔI ngày bắt đầu thành một ngày mới
    if (promotionData.startDate) {
      // Để tránh lỗi sai số vài giây do thời gian request từ Frontend bay xuống Backend
      // Ta nên trừ hao 1-2 phút (tùy nghiệp vụ), hoặc check đơn giản như sau:
      if (finalStartDate < new Date(now.getTime() - 60000)) {
        // Cho phép chênh lệch trễ 1 phút
        throw new BadRequestException(
          'Ngày bắt đầu mới không được nằm trong quá khứ',
        );
      }
    }

    // sửa đổi thồi gian bắt đầu và kết thúc
    return this.promotionRepository.update(id, promotionData);
  }

  // lấy danh sách khuyến mai đang diễn ra để áp dụng vào sách
  async getActivePromotions(): Promise<PromotionResponseDto[]> {
    try {
      const now = new Date();
      const promotions =
        await this.promotionRepository.findPromotionsActive(now);
      return promotions;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        'Error occurred while fetching active promotions',
        error,
      );
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi tải danh sách khuyến mãi, vui lòng thử lại sau.',
      );
    }
  }
}
