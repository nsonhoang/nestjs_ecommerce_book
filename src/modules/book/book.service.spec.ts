// Mock heavy dependencies before importing the module under test to avoid loading Prisma/generated client
jest.mock('./book.repository', () => ({
  BookRepository: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../categories/category.service', () => ({
  CategoryService: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../author/author.service', () => ({
  AuthorService: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('src/media/media.service', () => ({
  MediaService: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../image-book/image-book.service', () => ({
  ImageBookService: jest.fn().mockImplementation(() => ({})),
}));

const { BookService } = require('./book.service');

describe('BookService.updateBook - thumbnail flow', () => {
  let bookService: any;

  const mockBookRepository: any = {
    getBookById: jest.fn(),
    updateBook: jest.fn(),
  };

  const mockCategoryService: any = {};
  const mockAuthorService: any = {};

  const mockMediaService: any = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockImageBookService: any = {
    deleteImagesByBookId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    bookService = new BookService(
      mockBookRepository,
      mockCategoryService,
      mockAuthorService,
      mockMediaService,
      mockImageBookService,
    );
  });

  it('should upload new thumbnail and trigger deletion of old public id', async () => {
    const id = 'book-1';

    // existing book has an old thumbnail with versioned url
    mockBookRepository.getBookById.mockResolvedValueOnce({
      id,
      thumbnail:
        'https://res.cloudinary.com/demo/upload/v1234/nested/path/old_public_id.png',
    });

    // mediaService.uploadFile returns new secure_url
    mockMediaService.uploadFile.mockResolvedValueOnce({
      secure_url:
        'https://res.cloudinary.com/demo/upload/v5678/nested/path/new_public_id.png',
    });

    mockBookRepository.updateBook.mockResolvedValueOnce({
      id,
      thumbnail:
        'https://res.cloudinary.com/demo/upload/v5678/nested/path/new_public_id.png',
    });

    mockMediaService.deleteFile.mockResolvedValueOnce(true);

    const request: any = { title: 'updated' };
    const fakeFile: any = {
      originalname: 'thumb.png',
      buffer: Buffer.from('x'),
    };

    const result = await bookService.updateBook(id, request, fakeFile);

    // Ensure uploadFile was called and request.thumbnail was set when calling updateBook
    expect(mockMediaService.uploadFile).toHaveBeenCalled();
    expect(mockBookRepository.updateBook).toHaveBeenCalledWith(
      id,
      expect.objectContaining({
        thumbnail:
          'https://res.cloudinary.com/demo/upload/v5678/nested/path/new_public_id.png',
      }),
    );

    // Old public id should be extracted and deleteFile called with it
    // From URL above: after /upload/ -> 'v1234/nested/path/old_public_id.png' -> strip version -> 'nested/path/old_public_id.png' -> remove extension -> 'nested/path/old_public_id'
    expect(mockMediaService.deleteFile).toHaveBeenCalledWith(
      'nested/path/old_public_id',
    );

    expect(result).toBeDefined();
  });
});
