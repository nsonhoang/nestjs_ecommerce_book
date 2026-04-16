import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AddressService } from './address.service';

import { UpdateAddressDto } from './dto/update-address.request.dto';
import { AddressRequestDTO } from './dto/address.request.dto';
import { ApiResponse } from 'src/common/api-response';
import { Address } from 'generated/prisma/browser';
import { AddressResponseDTO } from './dto/address.response';

@Controller('/v1/address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  async create(
    @Body() createAddressDto: AddressRequestDTO,
  ): Promise<ApiResponse<AddressResponseDTO>> {
    const address = await this.addressService.create(createAddressDto);
    return ApiResponse.ok(address, 'Thêm địa chỉ thành công');
  }

  @Get()
  async findAll() {
    const addresses = await this.addressService.findAll();
    return ApiResponse.ok(addresses, 'Tìm tất cả địa chỉ thành công');
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<AddressResponseDTO>> {
    const address = await this.addressService.findOne(id);
    return ApiResponse.ok(address, 'Tìm địa chỉ thành công');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<ApiResponse<AddressResponseDTO>> {
    const address = await this.addressService.update(id, updateAddressDto);
    return ApiResponse.ok(address, 'Cập nhật địa chỉ thành công');
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    await this.addressService.remove(id);
    return ApiResponse.message('Xóa địa chỉ thành công', 200);
  }
}
