import { Exclude } from 'class-transformer';

// Cấu trúc chung của mọi phản hồi từ GHN
export interface IGhnResponse<T> {
  code: number;
  message: string;
  data: T;
}

export class ProvinceResponse {
  ProvinceID!: number;
  ProvinceName!: string;
  slug?: string | null;
}

export class DistrictResponse {
  DistrictID!: number;
  DistrictName!: string;
  ProvinceID!: number;
}

@Exclude()
export class WardResponse {
  WardCode!: string;
  WardName!: string;
  DistrictID!: number;
}
