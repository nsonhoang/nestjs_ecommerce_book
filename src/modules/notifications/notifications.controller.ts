import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { type RequestWithUser } from '../users/user.controller';

// thẳng này sinh ra để test gửi thông báo và lưu token thiết bị, không phải là API chính thức cho client sử dụng
@Controller('v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  //cái này để test
  @Post('test-send')
  async testSendNotification(
    @Req() req: RequestWithUser,
    @Body() body: { title: string; body: string },
  ) {
    // req.user.id lấy từ JwtAuthGuard (người đang đăng nhập)
    await this.notificationsService.sendNotificationToUser(
      req.user.userId,
      body.title,
      body.body,
    );

    return { message: 'Đã gửi lệnh bắn thông báo. Vui lòng xem log Terminal.' };
  }

  // cái này để test thôi
  @Post('token')
  async registerToken(
    @Req() req: RequestWithUser,
    @Body() body: { token: string; deviceOs?: string },
  ) {
    return this.notificationsService.saveDeviceToken(
      req.user.userId,
      body.token,
      body.deviceOs || 'unknown',
    );
  }
}
