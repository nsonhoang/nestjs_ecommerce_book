import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import {
  AddressRequestDTO,
  CreateAddressWithUserId,
} from './dto/address.request.dto';
import { AddressResponseDTO } from './dto/address.response';

export type AddressWithLocation = Omit<AddressResponseDTO, 'ward'> & {
  wardCode: string;
};

@Injectable()
export class AddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createAddressDto: CreateAddressWithUserId,
  ): Promise<AddressWithLocation> {
    const address = await this.prisma.address.create({
      data: {
        userId: createAddressDto.userId,
        fullName: createAddressDto.fullName,
        phone: createAddressDto.phone,
        addressLine: createAddressDto.addressLine,
        wardCode: createAddressDto.wardCode,
        districtId: createAddressDto.districtId,
        provinceId: createAddressDto.provinceId,
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
        wardCode: true,
        district: true,
        province: true,
        country: true,
        label: true,
        isDefault: true,
      },
    });

    return {
      ...address,
      district: {
        DistrictID: address.district.id,
        DistrictName: address.district.name,
        ProvinceID: address.district.provinceId,
      },
      province: {
        ProvinceID: address.province.id,
        ProvinceName: address.province.name,
      },
    };
  }

  async findAll(): Promise<AddressWithLocation[]> {
    const addresses = await this.prisma.address.findMany({
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        addressLine: true,
        wardCode: true,
        district: true,
        province: true,
        country: true,
        label: true,
        isDefault: true,
      },
    });

    return addresses.map((address) => ({
      ...address,
      district: {
        DistrictID: address.district.id,
        DistrictName: address.district.name,
        ProvinceID: address.district.provinceId,
      },
      province: {
        ProvinceID: address.province.id,
        ProvinceName: address.province.name,
      },
      label: address.label ?? undefined,
      country: address.country ?? undefined,
    }));
  }

  async findAllForUser(userId: string): Promise<AddressWithLocation[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        addressLine: true,
        wardCode: true,
        district: true,
        province: true,
        country: true,
        label: true,
        isDefault: true,
      },
    });

    return addresses.map((address) => ({
      ...address,
      district: {
        DistrictID: address.district.id,
        DistrictName: address.district.name,
        ProvinceID: address.district.provinceId,
      },
      province: {
        ProvinceID: address.province.id,
        ProvinceName: address.province.name,
      },
      label: address.label ?? undefined,
      country: address.country ?? undefined,
    }));
  }

  async findOne(id: string): Promise<AddressWithLocation | null> {
    const address = await this.prisma.address.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        addressLine: true,
        wardCode: true,
        district: true,
        province: true,
        country: true,
        label: true,
        isDefault: true,
      },
    });

    return address
      ? {
          ...address,
          district: {
            DistrictID: address.district.id,
            DistrictName: address.district.name,
            ProvinceID: address.district.provinceId,
          },
          province: {
            ProvinceID: address.province.id,
            ProvinceName: address.province.name,
          },
          label: address.label ?? undefined,
          country: address.country ?? undefined,
        }
      : null;
  }

  async findOneForUser(
    id: string,
    userId: string,
  ): Promise<AddressWithLocation | null> {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
      select: {
        id: true,
        userId: true,
        fullName: true,
        phone: true,
        addressLine: true,
        wardCode: true,
        district: true,
        province: true,
        country: true,
        label: true,
        isDefault: true,
      },
    });

    return address
      ? {
          ...address,
          district: {
            DistrictID: address.district.id,
            DistrictName: address.district.name,
            ProvinceID: address.district.provinceId,
          },
          province: {
            ProvinceID: address.province.id,
            ProvinceName: address.province.name,
          },
          label: address.label ?? undefined,
          country: address.country ?? undefined,
        }
      : null;
  }

  async update(
    id: string,
    updateAddressDto: Partial<AddressRequestDTO>,
  ): Promise<AddressWithLocation | null> {
    const address = await this.prisma.address.update({
      where: { id },
      data: {
        fullName: updateAddressDto.fullName,
        phone: updateAddressDto.phone,
        addressLine: updateAddressDto.addressLine,

        wardCode: updateAddressDto.wardCode ?? undefined,
        districtId: updateAddressDto.districtId ?? undefined,
        provinceId: updateAddressDto.provinceId ?? undefined,
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
        wardCode: true,
        district: true,
        province: true,
        country: true,
        label: true,
        isDefault: true,
      },
    });

    return address
      ? {
          ...address,
          district: {
            DistrictID: address.district.id,
            DistrictName: address.district.name,
            ProvinceID: address.district.provinceId,
          },
          province: {
            ProvinceID: address.province.id,
            ProvinceName: address.province.name,
          },
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
