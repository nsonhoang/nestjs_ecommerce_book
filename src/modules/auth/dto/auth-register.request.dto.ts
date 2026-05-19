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
import { Match } from 'src/common/decorators/match-password.decorator';

export class AuthRegisterRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString({ message: 'Email phải là chuỗi kí tự' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({ example: 'yourStrongPassword' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
  password!: string;

  @ApiProperty({ example: 'yourStrongPassword' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
  @Match('password', { message: 'Mật khẩu nhập lại không khớp' })
  confirmPassword!: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{9,11}$/, {
    message: 'Phone phải là số từ 9-11 chữ số',
  })
  phone?: string;
}
