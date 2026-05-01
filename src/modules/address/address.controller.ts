import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AddressService } from './address.service';

import { UpdateAddressDto } from './dto/update-address.request.dto';
import { AddressRequestDTO } from './dto/address.request.dto';
import { ApiResponse } from 'src/common/api-response';

import { AddressResponseDTO } from './dto/address.response';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { type RequestWithUser } from '../users/user.controller';

@Controller('/v1/address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  //phair ccos bearer token mới được tạo địa chỉ, cập nhật địa chỉ, xóa địa chỉ
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createAddressDto: AddressRequestDTO,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<AddressResponseDTO>> {
    const address = await this.addressService.create(
      createAddressDto,
      req.user.userId,
    );
    return ApiResponse.ok(address, 'Thêm địa chỉ thành công');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<AddressResponseDTO[]>> {
    const addresses: AddressResponseDTO[] =
      await this.addressService.findAllForUser(req.user.userId);
    return ApiResponse.ok(addresses, 'Tìm tất cả địa chỉ thành công');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<AddressResponseDTO>> {
    const address: AddressResponseDTO =
      await this.addressService.findOneForUser(id, req.user.userId);
    return ApiResponse.ok(address, 'Tìm địa chỉ thành công');
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<AddressResponseDTO>> {
    const address: AddressResponseDTO = await this.addressService.updateForUser(
      id,
      req.user.userId,
      updateAddressDto,
    );
    return ApiResponse.ok(address, 'Cập nhật địa chỉ thành công');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<unknown>> {
    await this.addressService.removeForUser(id, req.user.userId);
    return ApiResponse.message('Xóa địa chỉ thành công', 200);
  }
}
