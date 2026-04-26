import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetDistrictsQueryDto {
  @IsInt({ message: 'provinceId phải là số nguyên' })
  @IsNotEmpty({ message: 'provinceId là bắt buộc' })
  @Type(() => Number)
  provinceId!: number;
}

export class GetWardsQueryDto {
  @IsInt({ message: 'districtId phải là số nguyên' })
  @IsNotEmpty({ message: 'districtId là bắt buộc' })
  @Type(() => Number)
  districtId!: number;
}
