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
  @IsString({ message: 'Email phải là chuỗi kí tự' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{9,11}$/, {
    message: 'Phone phải là số từ 9-11 chữ số',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  roleId?: string;
}
