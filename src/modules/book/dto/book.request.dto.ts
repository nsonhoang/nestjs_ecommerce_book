import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  ArrayNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { parseStringArray } from 'src/utils/pasrseStringArray';

export class BookRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title!: string;

  @IsString()
  @IsOptional() // Cho phép null hoặc undefined nếu bạn muốn
  description!: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  @IsNumber()
  @Min(0, { message: 'Giá tiền không được nhỏ hơn 0' })
  price!: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString()
  @IsOptional() // thumbnail sẽ được set từ upload file
  thumbnail?: string;

  @Transform(({ value }: { value: unknown }) => parseStringArray(value))
  @IsArray({ message: 'categoryId phải là một mảng' })
  @ArrayNotEmpty({ message: 'Sách phải thuộc ít nhất một thể loại' })
  @IsString({ each: true, message: 'Mỗi categoryId phải là một chuỗi' })
  categoryId!: string[];

  @Transform(({ value }: { value: unknown }) => parseStringArray(value))
  @IsArray({ message: 'authorId phải là một mảng' })
  @ArrayNotEmpty({ message: 'Sách phải có ít nhất một tác giả' })
  @IsString({ each: true, message: 'Mỗi authorId phải là một chuỗi' })
  authorId!: string[];
}

// export class BookCategoryRequestDto {
//   categoryId!: string;
//   bookId!: string;
// }

// export class BookAuthorRequestDto {
//   authorId!: string;
//   bookId!: string;
// }
