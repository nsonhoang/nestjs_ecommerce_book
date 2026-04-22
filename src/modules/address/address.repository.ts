import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import {
  AddressRequestDTO,
  CreateAddressWithUserId,
} from './dto/address.request.dto';
import { AddressResponseDTO } from './dto/address.response';

@Injectable()
export class AddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createAddressDto: CreateAddressWithUserId,
  ): Promise<AddressResponseDTO> {
    const address = await this.prisma.address.create({
      data: {
        userId: createAddressDto.userId,
        fullName: createAddressDto.fullName,
        phone: createAddressDto.phone,
        addressLine: createAddressDto.addressLine,
        ward: createAddressDto.ward,
        district: createAddressDto.district,
        city: createAddressDto.city,
        country: createAddressDto.country ?? undefined,
        label: createAddressDto.label ?? undefined,
        isDefault: createAddressDto.isDefault ?? false,
      },
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        addressLine: true,
        ward: true,
        district: true,
        city: true,
        country: true,
        label: true,
        isDefault: true,
      },
    });

    return {
      ...address,
      label: address.label ?? undefined,
      country: address.country ?? undefined,
    };
  }

  async findAll(): Promise<AddressResponseDTO[]> {
    const addresses = await this.prisma.address.findMany({
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        addressLine: true,
        ward: true,
        district: true,
        city: true,
        country: true,
        label: true,
        isDefault: true,
      },
    });

    return addresses.map((address) => ({
      ...address,
      label: address.label ?? undefined,
      country: address.country ?? undefined,
    }));
  }

  async findOne(id: string): Promise<AddressResponseDTO | null> {
    const address = await this.prisma.address.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        addressLine: true,
        ward: true,
        district: true,
        city: true,
        country: true,
        label: true,
        isDefault: true,
      },
    });

    return address
      ? {
          ...address,
          label: address.label ?? undefined,
          country: address.country ?? undefined,
        }
      : null;
  }

  async update(
    id: string,
    updateAddressDto: Partial<AddressRequestDTO>,
  ): Promise<AddressResponseDTO | null> {
    const address = await this.prisma.address.update({
      where: { id },
      data: {
        fullName: updateAddressDto.fullName,
        phone: updateAddressDto.phone,
        addressLine: updateAddressDto.addressLine,

        ward: updateAddressDto.ward,
        district: updateAddressDto.district,
        city: updateAddressDto.city,
        country: updateAddressDto.country ?? undefined,
        label: updateAddressDto.label ?? undefined,
        isDefault: updateAddressDto.isDefault,
      },
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        addressLine: true,
        ward: true,
        district: true,
        city: true,
        country: true,
        label: true,
        isDefault: true,
      },
    });

    return address
      ? {
          ...address,
          label: address.label ?? undefined,
          country: address.country ?? undefined,
        }
      : null;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.address.delete({
      where: { id },
    });
  }
}
