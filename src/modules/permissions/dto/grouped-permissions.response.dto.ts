import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from './permission.response.dto';

export class GroupedPermissionsResponseDto {
  @ApiProperty({ example: 'Books', description: 'Tên phân hệ / module' })
  module!: string;

  @ApiProperty({
    type: [PermissionResponseDto],
    description: 'Danh sách các quyền thuộc phân hệ này',
  })
  permissions!: PermissionResponseDto[];
}
