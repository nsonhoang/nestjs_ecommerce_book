import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';

import { PromotionRequestDto } from './dto/promotion.request.dto';
import { ApiResponse } from 'src/common/api-response';
import { PromotionResponseDto } from './dto/promotion.response';
import { PromotionUpdateRequestDto } from './dto/promotion-update.request.dto';
import { PaginatePromotionDto } from './dto/pagination-promotion.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';

@Controller('/v1/promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post()
  async createPromotion(
    @Body() promotionData: PromotionRequestDto,
  ): Promise<ApiResponse<PromotionResponseDto>> {
    // Logic to create a promotion
    const newPromotion =
      await this.promotionService.createPromotion(promotionData);

    return ApiResponse.ok(
      newPromotion,
      'Thêm chương trình khuyến mãi thành công',
    );
  }

  @Get()
  async getAllPromotions(
    @Query() query: PaginatePromotionDto,
  ): Promise<ApiResponse<PaginatedResult<PromotionResponseDto>>> {
    const promotions = await this.promotionService.getAllPromotions(query);
    return ApiResponse.ok(
      promotions,
      'Lấy thành công danh sách chương trình khuyến mãi',
    );
  }

  @Get('/active')
  async getActivePromotions(): Promise<ApiResponse<PromotionResponseDto[]>> {
    const promotions = await this.promotionService.getActivePromotions();
    return ApiResponse.ok(
      promotions,
      'Lấy thành công danh sách chương trình khuyến mãi đang diễn ra',
    );
  }

  @Patch(':id')
  async updatePromotion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() promotionData: PromotionUpdateRequestDto,
  ): Promise<ApiResponse<PromotionResponseDto>> {
    // Logic to update a promotion
    const updatedPromotion = await this.promotionService.updatePromotion(
      id,
      promotionData,
    );
    return ApiResponse.ok(
      updatedPromotion,
      'Cập nhật chương trình khuyến mãi thành công',
    );
  }

  @Get('/:id')
  async getPromotionById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<PromotionResponseDto | null>> {
    const promotion = await this.promotionService.getPromotionById(id);

    return ApiResponse.ok(
      promotion,
      'Lấy thông tin chương trình khuyến mãi thành công',
    );
  }

  @Delete('/:id')
  async deletePromotion(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    await this.promotionService.deletePromotion(id);
    return ApiResponse.message('Xóa chương trình khuyến mãi thành công');
  }
}
