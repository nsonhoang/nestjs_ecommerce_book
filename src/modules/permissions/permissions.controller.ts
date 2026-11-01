import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponse } from 'src/common/api-response';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { PermissionsService } from './permissions.service';
import { GroupedPermissionsResponseDto } from './dto/grouped-permissions.response.dto';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('/v1/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({
    summary: 'Lấy danh mục tất cả quyền hệ thống (Gom nhóm theo Module)',
    description:
      'Trả về danh sách tất cả các permission có sẵn để Frontend hiển thị ma trận phân quyền (dạng cây hoặc checkbox).',
  })
  @ApiOkResponse({
    description: 'Lấy danh mục quyền thành công',
    type: [GroupedPermissionsResponseDto],
  })
  @Get()
  @UseGuards(JwtAuthGuard)
  async getPermissions(): Promise<ApiResponse<GroupedPermissionsResponseDto[]>> {
    const data = await this.permissionsService.getAllGrouped();
    return ApiResponse.ok(data, 'Lấy danh mục quyền thành công');
  }
}
