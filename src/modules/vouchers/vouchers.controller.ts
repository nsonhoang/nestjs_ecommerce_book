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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Vouchers')
@Controller('/v1/vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @ApiOperation({ summary: 'Tạo voucher (admin)' })
  @ApiBearerAuth()
  @ApiBody({ type: VouchersRequestDto })
  @ApiOkResponse({ description: 'Tạo voucher thành công' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async createVoucher(
    @Body() data: VouchersRequestDto,
  ): Promise<ApiResponse<VouchersResponseDto>> {
    const voucher = await this.vouchersService.createVoucher(data);
    return ApiResponse.ok(voucher, 'Tạo voucher thành công');
  }

  @ApiOperation({ summary: 'Lấy danh sách voucher' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiOkResponse({ description: 'Lấy danh sách voucher thành công' })
  @Get()
  async getVouchers(
    @Query() query: PaginateVouchersDto,
  ): Promise<ApiResponse<PaginatedResult<VouchersResponseDto>>> {
    const vouchers = await this.vouchersService.getVouchers(query);
    return ApiResponse.ok(vouchers, 'Lấy danh sách voucher thành công');
  }

  @ApiOperation({ summary: 'Lấy voucher theo id' })
  @ApiParam({ name: 'id', description: 'Voucher id' })
  @ApiOkResponse({ description: 'Lấy voucher thành công' })
  @Get('/:id')
  async getVoucherById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<VouchersResponseDto>> {
    const voucher = await this.vouchersService.getVoucherById(id);
    return ApiResponse.ok(voucher, 'Lấy thông tin voucher thành công');
  }

  @ApiOperation({ summary: 'Cập nhật voucher (admin)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Voucher id' })
  @ApiBody({ type: VouchersUpdateRequestDto })
  @ApiOkResponse({ description: 'Cập nhật voucher thành công' })
  @Patch('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async updateVoucher(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: VouchersUpdateRequestDto,
  ): Promise<ApiResponse<VouchersResponseDto>> {
    const voucher = await this.vouchersService.updateVoucher(id, data);
    return ApiResponse.ok(voucher, 'Cập nhật voucher thành công');
  }

  @ApiOperation({ summary: 'Xóa voucher (admin)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Voucher id' })
  @ApiOkResponse({ description: 'Xóa voucher thành công' })
  @Delete('/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
  async deleteVoucher(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<unknown>> {
    await this.vouchersService.deleteVoucher(id);
    return ApiResponse.message('Xóa voucher thành công');
  }
}
