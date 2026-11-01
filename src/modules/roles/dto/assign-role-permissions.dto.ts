import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AssignRolePermissionsDto {
  @ApiProperty({
    example: ['uuid-perm-1', 'uuid-perm-2'],
    description: 'Danh sách ID các quyền gán cho vai trò',
    type: [String],
  })
  @IsArray({ message: 'permissionIds phải là một danh sách chuỗi' })
  @ArrayNotEmpty({ message: 'Danh sách permissionIds không được rỗng' })
  @IsString({ each: true, message: 'Mỗi permissionId phải là chuỗi' })
  permissionIds!: string[];
}
