import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ReviewCreateRequestDto {
  @ApiProperty({ example: 'book-id' })
  @IsUUID()
  bookId!: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Sách rất hay' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;
}
