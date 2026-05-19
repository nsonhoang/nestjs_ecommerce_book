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
import { ApiProperty } from '@nestjs/swagger';

export class AddressRequestDTO {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên không được quá 100 ký tự' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  fullName!: string;

  @ApiProperty({ example: '0123456789' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{9,11}$/, {
    message: 'Số điện thoại phải từ 9-11 chữ số',
  })
  phone!: string;

  @ApiProperty({ example: '123 Main St, District 1' })
  @IsString()
  @MinLength(5, { message: 'Địa chỉ quá ngắn' })
  @MaxLength(255, { message: 'Địa chỉ không được quá 255 ký tự' })
  @IsNotEmpty({ message: 'Địa chỉ cụ thể không được để trống' })
  addressLine!: string;

  // 🏥 Phường/Xã: GHN quy định là String
  // cái này sẽ lấy từ API GHN trả về, nên client không cần gửi lên,
  //  chỉ cần gửi mã wardCode là đủ để xác định phường/xã
  @ApiProperty({ example: '00123' })
  @IsString()
  @IsNotEmpty({ message: 'Mã Phường/Xã là bắt buộc' })
  wardCode!: string;

  // 🏙️ Quận/Huyện: Trong Schema là Int, nên dùng IsInt
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'District ID phải là số nguyên' })
  @IsNotEmpty({ message: 'ID Quận/Huyện là bắt buộc' })
  @Type(() => Number) // Đảm bảo convert từ string sang number nếu nhận từ form-data
  districtId!: number;

  // 🗺️ Tỉnh/Thành phố: Trong Schema bạn đặt tên là cityId (Int)
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'City ID phải là số nguyên' })
  @IsNotEmpty({ message: 'ID Tỉnh/Thành phố là bắt buộc' })
  @Type(() => Number)
  provinceId!: number;

  @ApiProperty({ example: 'Giao giờ hành chính' })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Ghi chú không được quá 255 ký tự' })
  note?: string;

  @ApiProperty({ example: 'Việt Nam' })
  @IsOptional()
  @IsString()
  country?: string;

  // Nhãn địa chỉ (ví dụ: "Nhà", "Cơ quan", "Khác")
  @ApiProperty({ example: 'Nhà' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateAddressWithUserId extends AddressRequestDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'user123' })
  userId!: string;
}
