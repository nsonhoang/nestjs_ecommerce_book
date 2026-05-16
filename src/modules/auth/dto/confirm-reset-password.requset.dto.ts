import { IsString, MaxLength, Min, MinLength } from 'class-validator';

export class ConfirmResetPasswordRequestDto {
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
  newPassword!: string;
}
