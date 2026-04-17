import { BookMinifyResponseDto } from 'src/modules/book/dto/book.response.dto';

export class CartResponseDto {
  id!: string;
  userId!: string;
  items!: CartItemResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class CartItemResponseDto {
  id!: string;
  cartId!: string;
  book!: BookMinifyResponseDto;
  quantity!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
