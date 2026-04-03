import { IsNotEmpty, IsString } from 'class-validator';

export class RolesRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên role không được để trống' })
  name!: string;
}
