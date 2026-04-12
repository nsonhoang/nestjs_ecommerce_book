import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
} from 'class-validator';

export class BookUpdateRequestDto {
  @IsString()
  @IsOptional() // Cho phép null hoặc undefined nếu bạn muốn
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title!: string;

  @IsOptional() // Cho phép null hoặc undefined nếu bạn muốn
  @IsString()
  //   @IsNullable()
  description?: string | null;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Giá tiền không được nhỏ hơn 0' })
  price!: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  thumbnail!: string;

  @IsArray({ message: 'categoryId phải là một mảng' })
  //   @ArrayNotEmpty({ message: 'Sách phải thuộc ít nhất một thể loại' })
  @IsOptional()
  @IsString({ each: true, message: 'Mỗi categoryId phải là một chuỗi' })
  categoryId!: string[];

  @IsArray({ message: 'authorId phải là một mảng' })
  //   @ArrayNotEmpty({ message: 'Sách phải có ít nhất một tác giả' })
  @IsOptional()
  @IsString({ each: true, message: 'Mỗi authorId phải là một chuỗi' })
  authorId!: string[];
}
