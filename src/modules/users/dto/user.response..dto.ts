import { OmitType } from '@nestjs/mapped-types';
import { UserRequestDto } from './user.request.dto';

export class UserResponseDto extends OmitType(UserRequestDto, [
  'password',
] as const) {}
