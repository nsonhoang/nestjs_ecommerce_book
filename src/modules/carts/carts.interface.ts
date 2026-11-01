export interface ICartBook {
  id: string;
  title: string;
  price: number;
  thumbnail?: string | null;
}

export interface ICartItem {
  id: string;
  cartId: string;
  book: ICartBook;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICart {
  id: string;
  userId: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}
