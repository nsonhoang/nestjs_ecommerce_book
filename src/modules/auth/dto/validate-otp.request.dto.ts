import { ApiProperty } from '@nestjs/swagger';
import { Matches, Min } from 'class-validator';

export class ValidateOtpRequestDto {
  @ApiProperty({ example: '123456' })
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP phải bao gồm đúng 6 chữ số!',
  })
  otp!: string;
}
