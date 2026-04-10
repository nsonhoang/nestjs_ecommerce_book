import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserUpdateRequestDto {
  @IsOptional()
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
  roleId?: string; //cái này phải sử dụng enum để validate, nhưng tạm thời để string trước, sau này sẽ refactor lại sau khi có enum Role trong database và codebase
}
