// src/modules/ghn/ghn.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  IGhnResponse,
  ProvinceResponse,
  WardResponse,
  DistrictResponse,
} from './dto/ghn.response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GhnRepository } from './ghn.repository';

@Injectable()
export class GhnService {
  private readonly logger = new Logger(GhnService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly shopId: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ghnRepository: GhnRepository,
  ) {
    this.baseUrl =
      this.configService.get<string>('GHN_BASE_URL') ||
      'https://dev-online-gateway.ghn.vn/shiip/public-api';
    this.token = this.configService.get<string>('GHN_TOKEN') || '';
    this.shopId = this.configService.get<string>('GHN_SHOP_ID') || '';
  }

  async getProvincesFromDb(): Promise<ProvinceResponse[]> {
    try {
      const provinces = await this.ghnRepository.findAllProvinces();

      return provinces.map((p) => ({
        ProvinceID: p.id,
        ProvinceName: p.name,
        slug: p.slug ?? undefined,
      }));
    } catch (error) {
      this.logger.error('Lỗi khi lấy danh sách tỉnh/thành phố từ DB', error);
      throw error;
    }
  }

  async getDistrictsByProvinceFromDb(
    provinceId: number,
  ): Promise<DistrictResponse[]> {
    const districts =
      await this.ghnRepository.findDistrictsByProvinceId(provinceId);
    return districts.map((d) => ({
      DistrictID: d.id,
      DistrictName: d.name,
      ProvinceID: d.provinceId,
    }));
  }

  async onModuleInit() {
    const count = await this.prisma.province.count();
    if (count === 0) {
      this.logger.log('Data trống, bắt đầu sync địa danh từ GHN...');
      await this.syncProvinces();
    }

    // const autoSync = this.configService.get<string>('GHN_BASE_URL'); // Sử dụng biến môi trường để bật/tắt auto-sync
    // const token = this.configService.get<string>('GHN_TOKEN');
    // const shopId = this.configService.get<string>('GHN_SHOP_ID');

    // console.log('GHN_BASE_URL', autoSync);
    // console.log('GHN_TOKEN:', token);
    // console.log('GHN_SHOP_ID:', shopId);
  }

  // Header dùng chung cho tất cả API của GHN
  private get headers() {
    return {
      Token: this.token,
      ShopId: this.shopId,
      'Content-Type': 'application/json',
    };
  }

  // Ví dụ hàm lấy danh sách Tỉnh/Thành

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async syncProvinces() {
    // 1. Gọi API GHN
    this.logger.log('Bắt đầu đồng bộ toàn bộ địa danh...');
    const responseProvinceID = await firstValueFrom(
      this.httpService.get<IGhnResponse<ProvinceResponse[]>>(
        `${this.baseUrl}/master-data/province`,
        { headers: this.headers },
      ),
      // Log toàn bộ response để debug
    );
    // console.log('GHN API response:', responseProvinceID.data);
    // mới lấy  tỉnh còn chưa apply quận vào database
    //còn xã thì resApi riêng kh apply vào database được vì có quá nhiều xã, nên sẽ lấy trực tiếp từ API GHN khi cần thay vì lưu vào database
    const provinces = responseProvinceID.data.data;

    // 2. Lưu vào DB
    for (const p of provinces) {
      await this.prisma.province.upsert({
        where: { id: p.ProvinceID },
        update: { name: p.ProvinceName },
        create: {
          id: p.ProvinceID,
          name: p.ProvinceName,
          slug: p.slug ?? undefined,
        },
      });
    }
    return { imported: provinces.length };
  }

  async getWardsByDistrict(districtId: number) {
    const response = await firstValueFrom(
      this.httpService.get<IGhnResponse<WardResponse[]>>(
        `${this.baseUrl}/master-data/ward?district_id=${districtId}`,
        { headers: this.headers },
      ),
    );
    return response.data.data;
  }
}
