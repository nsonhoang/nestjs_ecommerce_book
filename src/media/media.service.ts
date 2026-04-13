import { Injectable } from '@nestjs/common';
import toStream from 'buffer-to-stream';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

export type UploadFile = {
  buffer: Buffer;
};

@Injectable()
export class MediaService {
  async uploadFile(
    position: string,
    file: UploadFile,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise<UploadApiResponse | UploadApiErrorResponse>(
      (resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            folder: `nestjs_ecommerce/books/${position}`,
            transformation: [
              { width: 600, height: 800, crop: 'fill', gravity: 'center' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              return reject(new Error(error.message));
            }

            if (!result) {
              return reject(new Error('Cloudinary upload failed'));
            }

            resolve(result);
          },
        );

        toStream(file.buffer).pipe(upload);
      },
    );
  }

  async deleteFile(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      void cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          return reject(new Error(error.message));
        }

        resolve(result);
      });
    });
  }
}
