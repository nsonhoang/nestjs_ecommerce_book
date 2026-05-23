import { AddressResponseDTO } from 'src/modules/address/dto/address.response';
import { RolesResponseDto } from 'src/modules/roles/dto/roles.response.dto';
import { UserStatus } from 'generated/prisma/enums';

export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string | null;
  phone!: string | null;
  status!: UserStatus;
  createdAt!: Date;
  updatedAt!: Date;
  role!: RolesResponseDto;
  addresses?: AddressResponseDTO[];
}
