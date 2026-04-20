export class PromotionResponseDto {
  id!: string;
  name!: string;
  discountRate!: number;
  isActive!: boolean;
  startDate!: Date;
  endDate!: Date;
  bookIds?: string[];
  bookCount?: number;
}
