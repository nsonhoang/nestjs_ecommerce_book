import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Request } from 'express';
import { ApiResponse } from 'src/common/api-response';

import { GhnService } from './ghn.service';
import { GetDistrictsQueryDto, GetWardsQueryDto } from './dto/ghn.query.dto';
import {
  DistrictResponse,
  ProvinceResponse,
  WardResponse,
} from './dto/ghn.response.dto';
import { GhnCalculateShippingRequestDto } from './dto/calculate-shipping.request.dto';
import { ShipmentsService } from '../shipments/shipments.service';
import { GhnWebhookGuard } from './ghn-webhook.guard';

@Controller('v1/ghn')
export class GhnController {
  constructor(
    private readonly ghnService: GhnService,
    private readonly shipmentsService: ShipmentsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('provinces')
  async getProvinces(): Promise<ApiResponse<ProvinceResponse[]>> {
    const provinces = await this.ghnService.getProvincesFromDb();
    return ApiResponse.ok(provinces, 'Lấy danh sách tỉnh/thành thành công');
  }

  @Get('districts')
  async getDistricts(
    @Query() query: GetDistrictsQueryDto,
  ): Promise<ApiResponse<DistrictResponse[]>> {
    const districts = await this.ghnService.getDistrictsByProvinceFromDb(
      query.provinceId,
    );
    return ApiResponse.ok(districts, 'Lấy danh sách quận/huyện thành công');
  }

  @Get('wards')
  async getWards(
    @Query() query: GetWardsQueryDto,
  ): Promise<ApiResponse<WardResponse[]>> {
    const wards = await this.ghnService.getWardsByDistrict(query.districtId);
    return ApiResponse.ok(wards, 'Lấy danh sách phường/xã thành công');
  }

  @Post('calculate-shipping')
  async calculateShipping(
    @Body() body: GhnCalculateShippingRequestDto,
  ): Promise<ApiResponse<{ shippingFee: number }>> {
    const shippingFee =
      await this.ghnService.calculateShippingForCheckout(body);
    return ApiResponse.ok({ shippingFee }, 'Tính phí vận chuyển thành công');
  }

  // xử lí webhook cập nhật phí vận chuyển từ GHN
  // custom useguard
  @Post('/webhook')
  @UseGuards(GhnWebhookGuard)
  async handleGhnWebhook(
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<ApiResponse<{ handled: boolean }>> {
    // NOTE: Không dùng DTO class cho webhook.
    // App đang bật global ValidationPipe + forbidNonWhitelisted;
    // GHN gửi thêm field có thể làm request bị 400 nếu validate.

    const orderCode =
      (body['order_code'] as string | undefined) ??
      (body['OrderCode'] as string | undefined) ??
      (body['orderCode'] as string | undefined);
    const status =
      (body['status'] as string | undefined) ??
      (body['Status'] as string | undefined) ??
      (body['status_name'] as string | undefined);

    if (!orderCode || !status) {
      // Trả 200 để GHN không retry spam; vẫn log bên server nếu cần.
      return ApiResponse.ok(
        { handled: false },
        'Webhook payload thiếu dữ liệu',
      );
    }

    const handled = await this.shipmentsService.handleGhnWebhook({
      orderCode,
      status,
      raw: body,
    });

    return ApiResponse.ok({ handled }, 'OK');
  }
}
