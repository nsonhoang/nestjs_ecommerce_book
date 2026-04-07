import { RolesResponseDto } from '../roles/dto/roles.response.dto';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: RolesResponseDto;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}
