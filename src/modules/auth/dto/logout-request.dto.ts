// src/modules/auth/dto/logout.request.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutRequestDto {
  @ApiPropertyOptional({
    example: 'fcm-token-xyz-123',
    description:
      'Mã token Firebase Cloud Messaging của thiết bị cần xóa khi logout',
  })
  @IsString()
  @IsOptional()
  fcmToken?: string;
}
