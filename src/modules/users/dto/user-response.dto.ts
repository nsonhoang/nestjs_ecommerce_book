import { AddressResponseDTO } from 'src/modules/address/dto/address.response';
import { RolesResponseDto } from 'src/modules/roles/dto/roles.response.dto';
import { UserStatus } from 'generated/prisma/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({
    example: ['book:read', 'inventory:view'],
    description: 'Danh sách các quyền của người dùng hiện tại phục vụ hiển thị UI',
    type: [String],
  })
  permissions?: string[];
}
