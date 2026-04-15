import { AuthorResponseDto } from 'src/modules/author/dto/author.response.dto';
import { CategoryResponseDto } from 'src/modules/categories/dto/categories.response.dto';
import { BookImageResponseDto } from 'src/modules/image-book/dto/book-image.response';

export class BookResponseDto {
  id!: string;
  title!: string;
  description!: string | null;
  price!: string;
  thumbnail!: string;
  categories?: CategoryResponseDto[];
  authors?: AuthorResponseDto[];
  images?: BookImageResponseDto[];
}
