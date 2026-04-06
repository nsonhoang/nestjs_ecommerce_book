import { RolesResponseDto } from '../roles/dto/roles.response.dto';

export interface User {
  id: string;
  email: string;
  password: string;
  role: RolesResponseDto;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}
