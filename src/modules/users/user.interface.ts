import { IRole } from '../roles';
import { UserStatus } from 'generated/prisma/enums';

export interface IUserProfile {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  role: IRole;
  permissions?: string[];
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: IRole;
  phone?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
