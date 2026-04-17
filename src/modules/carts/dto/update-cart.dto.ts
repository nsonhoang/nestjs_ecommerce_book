import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CartItemRequestDto } from './cart.request.dto';

export class UpdateCartItemDto extends PartialType(
  OmitType(CartItemRequestDto, ['bookId']),
) {}
