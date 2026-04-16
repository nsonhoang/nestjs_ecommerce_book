import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { InventoryLogType } from 'generated/prisma/client';

class InventoryRequestDto {
  @IsNotEmpty({ message: 'ID sách không được để trống' })
  @IsUUID('4', { message: 'ID sách không đúng định dạng' })
  bookId!: string;

  //không cần quantity khi tạo mới kho vì mặc định sẽ là 0 và phải có bước nhập kho để cập nhật số lượng sau
  // @IsOptional()
  // @IsNumber({}, { message: 'Số lượng phải là số' })
  // @Min(0, { message: 'Số lượng kho không được âm' })
  // quantity?: number;

  // @IsNotEmpty({ message: 'Vị trí kho không được để trống' })
  // @IsString({ message: 'Vị trí phải là chuỗi ký tự' })
  // location!: string;

  // //cái này không càn thiieets
  // @IsOptional()
  // @IsArray({ message: 'Danh sách log phải là một mảng' })
  // @ValidateNested({ each: true }) // Validate từng phần tử trong mảng
  // @Type(() => InventoryLogRequestDto) // Khai báo kiểu để class-transformer hiểu
  // inventoryLogs?: InventoryLogRequestDto[];
}

class InventoryLogRequestDto {
  @IsNotEmpty({ message: 'ID kho không được để trống' })
  // @IsUUID('4', { message: 'ID kho không đúng định dạng' })
  inventoryId!: string;

  @IsNotEmpty({ message: 'Số lượng thay đổi không được để trống' })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  // Không dùng
  // @Min(0, { message: 'Số lượng thay đổi không được âm' })
  change!: number;

  @IsNotEmpty({ message: 'Loại biến động không được để trống' })
  @IsEnum(InventoryLogType, {
    message: 'Loại biến động kho phải là IN, OUT hoặc ADJUST',
  })
  type!: InventoryLogType;

  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi ký tự' })
  reason?: string;
}

export type InventoryLogCommand = InventoryLogRequestDto & {
  userId: string;
};

export { InventoryRequestDto, InventoryLogRequestDto };
