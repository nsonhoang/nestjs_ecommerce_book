import { Matches, Min } from 'class-validator';

export class ValidateOtpRequestDto {
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP phải bao gồm đúng 6 chữ số!',
  })
  otp!: string;
}
