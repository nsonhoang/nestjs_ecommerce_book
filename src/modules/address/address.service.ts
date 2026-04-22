import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { UpdateAddressDto } from './dto/update-address.request.dto';
import { AddressResponseDTO } from './dto/address.response';
import { AddressRequestDTO } from './dto/address.request.dto';
import { AddressRepository } from './address.repository';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(private readonly addressRepository: AddressRepository) {}

  async create(
    createAddressDto: AddressRequestDTO,
    userId: string,
  ): Promise<AddressResponseDTO> {
    try {
      const address = await this.addressRepository.create({
        ...createAddressDto,
        userId,
      });
      return address;
    } catch (error) {
      this.logger.error('Error occurred while creating address', error);
      throw error;
    }
  }

  async findAll(): Promise<AddressResponseDTO[]> {
    return this.addressRepository.findAll();
  }

  async findOne(id: string): Promise<AddressResponseDTO> {
    const address = await this.addressRepository.findOne(id);
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }
    return address;
  }

  async update(
    id: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDTO> {
    const address = await this.addressRepository.update(id, updateAddressDto);

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ để cập nhật');
    }
    return address;
  }

  async remove(id: string): Promise<void> {
    const address = await this.addressRepository.findOne(id);
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ để xóa');
    }
    await this.addressRepository.remove(id);
  }
}
