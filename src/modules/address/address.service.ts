import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { UpdateAddressDto } from './dto/update-address.request.dto';
import { AddressResponseDTO } from './dto/address.response';
import { AddressRequestDTO } from './dto/address.request.dto';
import { AddressRepository } from './address.repository';
import { GhnRepository } from '../ghn/ghn.repository';
import { GhnService } from '../ghn/ghn.service';
import { WardResponse } from '../ghn/dto/ghn.response.dto';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly ghnRepository: GhnRepository,
    private readonly ghnService: GhnService,
  ) {}

  private async resolveWardFromApi(input: {
    districtId: number;
    wardCode: string;
  }): Promise<WardResponse> {
    const wards = await this.ghnService.getWardsByDistrict(input.districtId);
    const ward = wards.find((w) => w.WardCode === input.wardCode);
    if (!ward) {
      throw new NotFoundException('Phường/Xã không tồn tại');
    }
    return ward;
  }

  async create(
    createAddressDto: AddressRequestDTO,
    userId: string,
  ): Promise<AddressResponseDTO> {
    try {
      const provinceExist = await this.ghnRepository.findProvinceById(
        createAddressDto.provinceId,
      );
      if (!provinceExist) {
        throw new NotFoundException('Tỉnh/Thành phố không tồn tại');
      }

      const districtExist = await this.ghnRepository.findDistrictById(
        createAddressDto.districtId,
      );
      if (
        !districtExist ||
        districtExist.provinceId !== createAddressDto.provinceId
      ) {
        throw new NotFoundException('Quận/Huyện không tồn tại');
      }

      const ward = await this.resolveWardFromApi({
        districtId: createAddressDto.districtId,
        wardCode: createAddressDto.wardCode,
      });

      const address = await this.addressRepository.create({
        addressLine: createAddressDto.addressLine,
        provinceId: createAddressDto.provinceId,
        districtId: createAddressDto.districtId,
        fullName: createAddressDto.fullName,
        phone: createAddressDto.phone,
        wardCode: createAddressDto.wardCode,
        country: createAddressDto.country,
        label: createAddressDto.label,
        isDefault: createAddressDto.isDefault,
        userId,
      });

      return { ...address, ward };
    } catch (error) {
      this.logger.error('Error occurred while creating address', error);
      throw error;
    }
  }

  async findAll(): Promise<AddressResponseDTO[]> {
    const addresses = await this.addressRepository.findAll();
    const wardCache = new Map<number, WardResponse[]>();

    return Promise.all(
      addresses.map(async (address) => {
        const districtId = address.district.DistrictID;
        const cached = wardCache.get(districtId);
        const wards =
          cached ?? (await this.ghnService.getWardsByDistrict(districtId));
        if (!cached) {
          wardCache.set(districtId, wards);
        }
        const ward = wards.find((w) => w.WardCode === address.wardCode);
        if (!ward) {
          throw new NotFoundException('Phường/Xã không tồn tại');
        }
        return { ...address, ward };
      }),
    );
  }

  async findOne(id: string): Promise<AddressResponseDTO> {
    const address = await this.addressRepository.findOne(id);
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    const ward = await this.resolveWardFromApi({
      districtId: address.district.DistrictID,
      wardCode: address.wardCode,
    });

    return { ...address, ward };
  }

  async findOneForUser(
    id: string,
    userId: string,
  ): Promise<AddressResponseDTO> {
    const address = await this.addressRepository.findOneForUser(id, userId);
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    const ward = await this.resolveWardFromApi({
      districtId: address.district.DistrictID,
      wardCode: address.wardCode,
    });

    return { ...address, ward };
  }

  async update(
    id: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDTO> {
    const existing = await this.addressRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy địa chỉ để cập nhật');
    }

    const nextProvinceId =
      updateAddressDto.provinceId ?? existing.province.ProvinceID;
    const nextDistrictId =
      updateAddressDto.districtId ?? existing.district.DistrictID;
    const nextWardCode = updateAddressDto.wardCode ?? existing.wardCode;

    const provinceExist =
      await this.ghnRepository.findProvinceById(nextProvinceId);
    if (!provinceExist) {
      throw new NotFoundException('Tỉnh/Thành phố không tồn tại');
    }

    const districtExist =
      await this.ghnRepository.findDistrictById(nextDistrictId);
    if (!districtExist || districtExist.provinceId !== nextProvinceId) {
      throw new NotFoundException('Quận/Huyện không tồn tại');
    }

    const ward = await this.resolveWardFromApi({
      districtId: nextDistrictId,
      wardCode: nextWardCode,
    });

    const address = await this.addressRepository.update(id, {
      ...updateAddressDto,
      provinceId: nextProvinceId,
      districtId: nextDistrictId,
      wardCode: nextWardCode,
    });

    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ để cập nhật');
    }

    return { ...address, ward };
  }

  async remove(id: string): Promise<void> {
    const address = await this.addressRepository.findOne(id);
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ để xóa');
    }
    await this.addressRepository.remove(id);
  }
}
