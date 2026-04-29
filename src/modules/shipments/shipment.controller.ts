import { Controller, Get } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';

@Controller('/v1/shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  // chỉ cần phương thức getAllShipments để test, các phương thức còn update sẽ không có mà chi tạo trong service
  // khi nào ghn gửi web hook thì sẽ tự động cập nhật trạng thái đơn hàng, nên sẽ không cần phương thức update trong controller nữa
  @Get()
  async getAllShipments() {
    return this.shipmentsService.getAllShipments();
  }
}
