import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsString({ message: 'Email phải là chuỗi kí tự' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({ example: 'yourStrongPassword' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password!: string;

  @ApiPropertyOptional({ example: 'fcm-token-value' })
  @IsOptional() // đối với web có thể không cần FCM token, nhưng đối với mobile thì cần để gửi thông báo đẩy
  @IsString()
  fcmToken?: string;

  @ApiPropertyOptional({ example: 'android' })
  @IsOptional()
  @IsString()
  deviceOs?: string; // Ví dụ gửi lên 'android', 'ios' hoặc 'web'
}
