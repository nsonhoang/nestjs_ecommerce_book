import { PartialType } from '@nestjs/mapped-types';
import { InventoryRequestDto } from './inventory.request.dto';

export class UpdateInventoryDto extends PartialType(InventoryRequestDto) {}
