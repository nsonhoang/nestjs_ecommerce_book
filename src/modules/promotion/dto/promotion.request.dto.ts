import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsArray,
  IsUUID,
} from 'class-validator';

export class PromotionRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên chương trình không được để trống' })
  name!: string;

  @IsInt()
  @Min(1, { message: 'Mức giảm tối thiểu là 1%' })
  @Max(100, { message: 'Mức giảm tối đa là 100%' })
  discountRate!: number;

  @IsDateString({}, { message: 'Ngày bắt đầu không đúng định dạng' })
  startDate!: string;

  @IsDateString({}, { message: 'Ngày kết thúc không đúng định dạng' })
  endDate!: string;

  // Nhận vào một mảng ID sách để áp dụng khuyến mãi
  @IsArray()
  @IsUUID('4', { each: true, message: 'ID sách không hợp lệ' })
  bookIds!: string[];
}
