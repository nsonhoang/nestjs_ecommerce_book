import { DiscountType } from './vouchers.request.dto';

export class VouchersResponseDto {
  id!: string;
  code!: string;
  description?: string | null;

  discountType!: DiscountType;
  discountValue!: number;
  maxDiscount?: number | null;
  minOrderValue!: number;

  usageLimit!: number;
  usedCount!: number;

  startDate!: Date;
  endDate!: Date;
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}
