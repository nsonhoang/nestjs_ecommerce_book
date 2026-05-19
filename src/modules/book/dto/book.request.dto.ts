import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Clean Architecture' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title!: string;

  @ApiPropertyOptional({ example: 'Mô tả sách' })
  @IsString()
  @IsOptional() // Cho phép null hoặc undefined nếu bạn muốn
  description!: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  @IsNumber()
  @Min(0, { message: 'Giá tiền không được nhỏ hơn 0' })
  @ApiProperty({ example: 120000 })
  price!: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString()
  @IsOptional() // thumbnail sẽ được set từ upload file
  // cái này bên backend sẽ xử lý nếu có file upload lên thì sẽ lấy đường dẫn file đó gán vào thumbnail, còn nếu không có file nào được upload lên thì sẽ giữ nguyên giá trị thumbnail hiện tại (nếu đang update) hoặc để undefined (nếu đang tạo mới)
  thumbnail?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Ảnh bìa của sách (Chấp nhận png, jpeg, jpg; tối đa 2MB)',
  })
  @IsOptional() // Cho phép không upload file, nếu không có file nào được upload lên thì sẽ giữ nguyên giá trị thumbnail hiện tại (nếu đang update) hoặc để undefined (nếu đang tạo mới)
  file: any; // Định nghĩa ở đây để Swagger gom chung vào giao diện nhập liệu

  @Transform(({ value }: { value: unknown }) => parseStringArray(value))
  @IsArray({ message: 'categoryId phải là một mảng' })
  @ArrayNotEmpty({ message: 'Sách phải thuộc ít nhất một thể loại' })
  @IsString({ each: true, message: 'Mỗi categoryId phải là một chuỗi' })
  @ApiProperty({ example: ['category-id'] })
  categoryId!: string[];

  @Transform(({ value }: { value: unknown }) => parseStringArray(value))
  @IsArray({ message: 'authorId phải là một mảng' })
  @ArrayNotEmpty({ message: 'Sách phải có ít nhất một tác giả' })
  @IsString({ each: true, message: 'Mỗi authorId phải là một chuỗi' })
  @ApiProperty({ example: ['author-id'] })
  authorId!: string[];
}

export class CreateBookWithThumbNail {
  title!: string;

  description!: string | null;

  price!: number;

  thumbnail?: string;

  categoryId!: string[];

  authorId!: string[];
}
