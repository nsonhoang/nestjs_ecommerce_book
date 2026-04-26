import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GhnRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllProvinces() {
    return this.prisma.province.findMany();
  }

  findProvinceById(provinceId: number) {
    return this.prisma.province.findUnique({
      where: { id: provinceId },
    });
  }

  findDistrictsByProvinceId(provinceId: number) {
    return this.prisma.district.findMany({
      where: { provinceId },
    });
  }

  findDistrictById(districtId: number) {
    return this.prisma.district.findUnique({
      where: { id: districtId },
    });
  }
}
