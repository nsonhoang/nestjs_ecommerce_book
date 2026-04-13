import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { CloudinaryProvider } from './cloudinary/cloudinary';

@Module({
  providers: [CloudinaryProvider, MediaService],
  exports: [CloudinaryProvider, MediaService],
})
export class MediaModule {}
