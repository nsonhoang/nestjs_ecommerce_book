import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressRequestDTO {
  @IsString()
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên không được quá 100 ký tự' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  fullName!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{9,11}$/, {
    message: 'Số điện thoại phải từ 9-11 chữ số',
  })
  phone!: string;

  @IsString()
  @MinLength(5, { message: 'Địa chỉ quá ngắn' })
  @MaxLength(255, { message: 'Địa chỉ không được quá 255 ký tự' })
  @IsNotEmpty({ message: 'Địa chỉ cụ thể không được để trống' })
  addressLine!: string;

  // 🏥 Phường/Xã: GHN quy định là String

  @IsString()
  @IsNotEmpty({ message: 'Mã Phường/Xã là bắt buộc' })
  wardCode!: string;

  // 🏙️ Quận/Huyện: Trong Schema là Int, nên dùng IsInt
  @IsInt({ message: 'District ID phải là số nguyên' })
  @IsNotEmpty({ message: 'ID Quận/Huyện là bắt buộc' })
  @Type(() => Number) // Đảm bảo convert từ string sang number nếu nhận từ form-data
  districtId!: number;

  // 🗺️ Tỉnh/Thành phố: Trong Schema bạn đặt tên là cityId (Int)
  @IsInt({ message: 'City ID phải là số nguyên' })
  @IsNotEmpty({ message: 'ID Tỉnh/Thành phố là bắt buộc' })
  @Type(() => Number)
  provinceId!: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateAddressWithUserId extends AddressRequestDTO {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
