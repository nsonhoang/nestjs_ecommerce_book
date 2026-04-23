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

import { ApiResponse } from 'src/common/api-response';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';

import { AuthRole } from '../roles/roles.enum';
import { PaginatedResult } from 'src/common/types/paginated-result.type';
import { PaginateVouchersDto } from 'src/modules/vouchers/dto/pagination-vouchers.dto';
import { VouchersRequestDto } from 'src/modules/vouchers/dto/vouchers.request.dto';
import { VouchersResponseDto } from 'src/modules/vouchers/dto/vouchers.response.dto';
import { VouchersUpdateRequestDto } from 'src/modules/vouchers/dto/vouchers-update.request.dto';
import { VouchersService } from './vouchers.service';

@Controller('/v1/vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  async createVoucher(
    @Body() data: VouchersRequestDto,
  ): Promise<ApiResponse<VouchersResponseDto>> {
    const voucher = await this.vouchersService.createVoucher(data);
    return ApiResponse.ok(voucher, 'Tạo voucher thành công');
  }

  @Get()
  async getVouchers(
    @Query() query: PaginateVouchersDto,
  ): Promise<ApiResponse<PaginatedResult<VouchersResponseDto>>> {
    const vouchers = await this.vouchersService.getVouchers(query);
    return ApiResponse.ok(vouchers, 'Lấy danh sách voucher thành công');
  }

  @Get('/:id')
  async getVoucherById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<VouchersResponseDto>> {
    const voucher = await this.vouchersService.getVoucherById(id);
    return ApiResponse.ok(voucher, 'Lấy thông tin voucher thành công');
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  async updateVoucher(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: VouchersUpdateRequestDto,
  ): Promise<ApiResponse<VouchersResponseDto>> {
    const voucher = await this.vouchersService.updateVoucher(id, data);
    return ApiResponse.ok(voucher, 'Cập nhật voucher thành công');
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  async deleteVoucher(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    await this.vouchersService.deleteVoucher(id);
    return ApiResponse.message('Xóa voucher thành công');
  }
}
