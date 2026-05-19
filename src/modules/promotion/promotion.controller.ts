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
  UseGuards,
} from '@nestjs/common';
import { minutes, Throttle } from '@nestjs/throttler';
import { PromotionService } from './promotion.service';

import { PromotionRequestDto } from './dto/promotion.request.dto';
import { ApiResponse } from 'src/common/api-response';
import { PromotionResponseDto } from './dto/promotion.response';
import { PromotionUpdateRequestDto } from './dto/promotion-update.request.dto';
import { PaginatePromotionDto } from './dto/pagination-promotion.dto';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthRole } from '../roles/roles.enum';
import { PromotionNotifyRequestDto } from './dto/promotion-notify.request.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Promotions')
@Controller('/v1/promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @ApiOperation({ summary: 'Tạo khuyến mãi (admin/staff)' })
  @ApiBearerAuth()
  @ApiBody({ type: PromotionRequestDto })
  @ApiOkResponse({ description: 'Tạo khuyến mãi thành công' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
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

  @ApiOperation({ summary: 'Gửi thông báo khuyến mãi (admin/staff)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Promotion id' })
  @ApiBody({ type: PromotionNotifyRequestDto })
  @ApiOkResponse({ description: 'Gửi thông báo khuyến mãi thành công' })
  @Post('/:id/notify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async notifyUsersAboutPromotion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() notificationData: PromotionNotifyRequestDto,
  ): Promise<ApiResponse<unknown>> {
    // Gửi thông báo đến các người dùng
    await this.promotionService.sendPromotionNotification(
      notificationData.title,
      notificationData.body,
      id,
    );

    return ApiResponse.message('Gửi thông báo thành công');
  }

  @ApiOperation({ summary: 'Lấy danh sách khuyến mãi' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiOkResponse({ description: 'Lấy danh sách khuyến mãi thành công' })
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

  @ApiOperation({ summary: 'Lấy danh sách khuyến mãi đang diễn ra' })
  @ApiOkResponse({ description: 'Lấy khuyến mãi đang diễn ra thành công' })
  @Get('/active')
  async getActivePromotions(): Promise<ApiResponse<PromotionResponseDto[]>> {
    const promotions = await this.promotionService.getActivePromotions();
    return ApiResponse.ok(
      promotions,
      'Lấy thành công danh sách chương trình khuyến mãi đang diễn ra',
    );
  }

  @ApiOperation({ summary: 'Cập nhật khuyến mãi (admin/staff)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Promotion id' })
  @ApiBody({ type: PromotionUpdateRequestDto })
  @ApiOkResponse({ description: 'Cập nhật khuyến mãi thành công' })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
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

  @ApiOperation({ summary: 'Lấy khuyến mãi theo id' })
  @ApiParam({ name: 'id', description: 'Promotion id' })
  @ApiOkResponse({ description: 'Lấy khuyến mãi thành công' })
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

  @ApiOperation({ summary: 'Xóa khuyến mãi (admin/staff)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Promotion id' })
  @ApiOkResponse({ description: 'Xóa khuyến mãi thành công' })
  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async deletePromotion(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    await this.promotionService.deletePromotion(id);
    return ApiResponse.message('Xóa chương trình khuyến mãi thành công');
  }
}
