import { OmitType } from '@nestjs/mapped-types';
import { BookMinifyResponseDto } from 'src/modules/book/dto/book.response.dto';

export class InventoryResponseDto {
  id!: string;
  book!: BookMinifyResponseDto;
  quantity!: number;
  createdAt!: Date;
  updatedAt!: Date;
  logs?: InventoryLogResponseDto[];
}

export class InventoryForUserResponseDto extends OmitType(
  InventoryResponseDto,
  ['logs'],
) {}

export class InventoryLogResponseDto {
  id!: string;
  inventoryId!: string;
  change!: number;
  beforeQty!: number;
  afterQty!: number;
  reason?: string | null;
  type!: string;
  createdAt!: Date;
}
