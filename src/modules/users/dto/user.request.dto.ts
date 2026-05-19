import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString({ message: 'Email phải là chuỗi kí tự' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({ example: 'yourStrongPassword' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  // @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password!: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name!: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{9,11}$/, {
    message: 'Phone phải là số từ 9-11 chữ số',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'role-id' })
  @IsOptional()
  @IsString()
  roleId?: string;
}
