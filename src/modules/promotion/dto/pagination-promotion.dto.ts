import {
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class PaginatePromotionDto extends PaginationQueryDto {
  //   @IsOptional()
  //   @IsUUID('4', { message: 'ID sách không hợp lệ' })
  //   bookId?: string;

  @IsOptional()
  // Chuyển chuỗi 'true'/'false' từ URL thành kiểu boolean thực thụ
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Trạng thái hoạt động phải là kiểu boolean' })
  isActive?: boolean;

  @IsOptional()
  // Chuyển chuỗi ISO date từ URL thành đối tượng Date của JS
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'Ngày kết thúc không đúng định dạng' })
  endDate?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'Ngày bắt đầu không đúng định dạng' })
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'now phải là kiểu boolean' })
  now?: boolean;
}
