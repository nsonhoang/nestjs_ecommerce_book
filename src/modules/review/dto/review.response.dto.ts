export class ReviewResponseDto {
  id!: string;
  userId!: string;
  bookId!: string;
  rating!: number;
  content?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
