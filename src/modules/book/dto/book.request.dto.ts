export class BookRequestDto {
  title!: string;
  description!: string | null;
  price!: number;
  thumbnail!: string;
  categoryId!: string[];
  authorId!: string[];
}

// export class BookCategoryRequestDto {
//   categoryId!: string;
//   bookId!: string;
// }

// export class BookAuthorRequestDto {
//   authorId!: string;
//   bookId!: string;
// }
