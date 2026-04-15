import { IsNotEmpty, IsString } from 'class-validator';

export class BookImageRequestDto {
  @IsNotEmpty()
  @IsString()
  bookId!: string;
}
