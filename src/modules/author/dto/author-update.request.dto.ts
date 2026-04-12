import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional } from 'class-validator';

export class AuthorUpdateRequestDto {
  @IsOptional()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfBirth?: Date;
  @IsOptional()
  info?: string;
  @IsOptional()
  nationality?: string;
}
