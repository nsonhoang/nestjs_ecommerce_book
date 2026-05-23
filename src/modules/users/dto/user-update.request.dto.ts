import { ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserStatus } from 'generated/prisma/enums';

export class UserUpdateRequestDto {
  @ApiPropertyOptional({ example: 'Nguyen Van B' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name!: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{9,11}$/, {
    message: 'Phone phải là số từ 9-11 chữ số',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'role-id' })
  @IsOptional()
  @IsString()
  roleId?: string; //cái này phải sử dụng enum để validate, nhưng tạm thời để string trước, sau này sẽ refactor lại sau khi có enum Role trong database và codebase

  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái không hợp lệ' })
  status?: UserStatus;
}

export class UserUpdateByUserRequestDto extends OmitType(UserUpdateRequestDto, [
  'roleId',
  'status',
] as const) {}
