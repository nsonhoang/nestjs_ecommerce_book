import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ example: 'uuid-1234' })
  id!: string;

  @ApiProperty({ example: 'book:create' })
  name!: string;

  @ApiProperty({ example: 'Tạo sách mới', required: false, nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'Books' })
  module!: string;
}
