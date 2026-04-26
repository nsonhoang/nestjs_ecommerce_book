import {
  DistrictResponse,
  ProvinceResponse,
  WardResponse,
} from 'src/modules/ghn/dto/ghn.response.dto';

export class AddressResponseDTO {
  id!: string;

  userId!: string;

  fullName!: string;

  phone!: string;

  addressLine!: string;

  ward!: WardResponse;

  district!: DistrictResponse;

  province!: ProvinceResponse;

  // 🌍 Optional

  country?: string;

  label?: string | null;

  isDefault?: boolean;
}
