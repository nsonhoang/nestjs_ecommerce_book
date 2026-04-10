import { RolesResponseDto } from 'src/modules/roles/dto/roles.response.dto';

export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string | null;
  phone!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  role!: RolesResponseDto;
}
