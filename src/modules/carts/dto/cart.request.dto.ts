import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { parseStringArray } from 'src/utils/pasrseStringArray';

// export class CartRequestDto {
//   id!: string;
//   userId!: string;
// }
export class CartItemRequestDto {
  // @
  // @IsNotEmpty()
  // @IsUUID()
  // cartId!: string;
  @IsNotEmpty()
  bookId!: string;

  // @IsNotEmpty()
  // @IsUUID()
  // userId!: string;

  @IsNotEmpty({ message: 'Vui lòng nhập số lượng' })
  @IsInt({ message: 'Số lượng bắt buộc phải là số nguyên' })
  @Min(1, { message: 'Số lượng thêm vào giỏ ít nhất phải là 1' })
  quantity!: number;
}

//cái này ở tần service
export class UpdateCartItemWithUserId extends CartItemRequestDto {
  userId!: string;
}

export class DeleteCartItemRequestDto {
  // @Transform(({ value }: { value: unknown }) => parseStringArray(value))
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Mỗi ID phải là một UUID hợp lệ' })
  cartItemid!: string[];
}
