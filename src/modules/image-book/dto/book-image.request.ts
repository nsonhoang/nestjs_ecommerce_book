import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class BookImageRequestDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  bookId!: string;
}
