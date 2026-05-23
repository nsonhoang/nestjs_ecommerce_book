import { RolesResponseDto } from '../roles/dto/roles.response.dto';
import { UserStatus } from 'generated/prisma/enums';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: RolesResponseDto;
  phone?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
