import { IsInt, IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryLogType } from 'generated/prisma/enums';

export class PaginateInventoryLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @IsOptional()
  @IsUUID('4')
  inventoryId?: string;

  @IsOptional()
  @IsEnum(InventoryLogType)
  type?: InventoryLogType;

  @IsOptional()
  @IsString()
  from?: string; // ISO date string

  @IsOptional()
  @IsString()
  to?: string; // ISO date string
}

export default PaginateInventoryLogsDto;
