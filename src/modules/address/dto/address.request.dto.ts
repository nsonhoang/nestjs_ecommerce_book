import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class AddressRequestDTO {
  @IsNotEmpty()
  @IsString()
  userId!: string;

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
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  addressLine!: string;

  // 🧠 Thêm cho đúng chuẩn VN
  @IsString()
  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  ward!: string;

  @IsString()
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  district!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  city!: string;

  // 🌍 Optional
  @IsOptional()
  @IsString()
  country?: string;

  // 🏷️ Label (Home, Office)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  // ⭐ Default address
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
