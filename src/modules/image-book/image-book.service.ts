import { Injectable } from '@nestjs/common';

import { ImageBookRepository } from './image-book.repository';

@Injectable()
export class ImageBookService {
  constructor(private readonly imageBookRepository: ImageBookRepository) {}

  async getImages(): Promise<unknown[]> {
    void this.imageBookRepository;
    return Promise.resolve([]);
  }

  async getImagesByBookId(bookId: string): Promise<unknown[]> {
    void bookId;
    void this.imageBookRepository;
    return Promise.resolve([]);
  }

  asy;
}
