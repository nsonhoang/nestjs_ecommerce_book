import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';

import {
  InventoryLogRequestDto,
  InventoryRequestDto,
} from './dto/inventory.request.dto';
import { ApiResponse } from 'src/common/api-response';
import {
  InventoryLogResponseDto,
  InventoryResponseDto,
} from './dto/inventory.response.dto';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { AuthRole } from '../roles/roles.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { type RequestWithUser } from '../users/user.controller';

// flow như thế này: khi thêm sách xong nhấn vào sách để xem đã có  kho chứa chưa nếu có thì tạo có thể tạo thêm kho,
// rồi vào kho đấu xể nhập xuất kho

@Controller('/v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // nguyên cái này chỉ cho admin xem
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async create(
    @Body() createInventoryDto: InventoryRequestDto,
  ): Promise<ApiResponse<InventoryResponseDto>> {
    const inventory = await this.inventoryService.create(createInventoryDto);
    return ApiResponse.ok<InventoryResponseDto>(
      inventory,
      'Inventory created successfully',
    );
  }

  //hàm xuất nhập kho , chỉ admin với staff mới đc phép thao tác
  @Post('/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async createInventoryLog(
    @Body() inventoryLogDto: InventoryLogRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<ApiResponse<InventoryLogResponseDto>> {
    const inventoryLog = await this.inventoryService.createInventoryLog(
      inventoryLogDto,
      req.user,
    );
    return ApiResponse.ok<InventoryLogResponseDto>(
      inventoryLog,
      'Inventory log created successfully',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async findAll(): Promise<ApiResponse<InventoryResponseDto[]>> {
    const inventory = await this.inventoryService.findAll();
    return ApiResponse.ok<InventoryResponseDto[]>(
      inventory,
      'Inventories retrieved successfully',
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<InventoryResponseDto | null>> {
    const inventory = await this.inventoryService.findOne(id);
    return ApiResponse.ok<InventoryResponseDto | null>(
      inventory,
      'Inventory found successfully',
    );
  }

  //hamf này không cần thiết có làm hệ thông cập nhật không đồng bộ lỗi quantity
  // @Patch(':id')
  // async update(
  //   @Param('id') id: string,
  //   @Body() updateInventoryDto: UpdateInventoryDto,
  // ): Promise<ApiResponse<InventoryResponseDto>> {
  //   const inventory = await this.inventoryService.update(
  //     id,
  //     updateInventoryDto,
  //   );
  //   return ApiResponse.ok<InventoryResponseDto>(
  //     inventory,
  //     'Inventory updated successfully',
  //   );
  // }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async remove(@Param('id') id: string) {
    await this.inventoryService.remove(id);
    return ApiResponse.message('Xóa thành công');
  }
}
