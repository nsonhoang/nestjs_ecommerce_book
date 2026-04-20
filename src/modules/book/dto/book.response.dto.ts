import { OmitType } from '@nestjs/mapped-types';
import { AuthorResponseDto } from 'src/modules/author/dto/author.response.dto';
import { CategoryResponseDto } from 'src/modules/categories/dto/categories.response.dto';
import { BookImageResponseDto } from 'src/modules/image-book/dto/book-image.response';
import { PromotionResponseDto } from 'src/modules/promotion/dto/promotion.response';

export class BookResponseDto {
  id!: string;
  title!: string;
  description!: string | null;
  price!: number;
  thumbnail!: string;
  priceAfterDiscount?: number;
  discountRate?: number;
  categories?: CategoryResponseDto[];
  authors?: AuthorResponseDto[];
  images?: BookImageResponseDto[];
}

export class BookDetailResponseDto extends BookResponseDto {
  promotions?: PromotionResponseDto[];
}

export class BookMinifyResponseDto extends OmitType(BookResponseDto, [
  'description',
  'categories',
  'authors',
  'images',
]) {}
