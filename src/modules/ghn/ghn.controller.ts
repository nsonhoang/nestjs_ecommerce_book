import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiResponse } from 'src/common/api-response';

import { GhnService } from './ghn.service';
import { GetDistrictsQueryDto, GetWardsQueryDto } from './dto/ghn.query.dto';
import {
  DistrictResponse,
  ProvinceResponse,
  WardResponse,
} from './dto/ghn.response.dto';
import { GhnCalculateShippingRequestDto } from './dto/calculate-shipping.request.dto';

@Controller('/v1/ghn')
export class GhnController {
  constructor(private readonly ghnService: GhnService) {}

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
}
