import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { type RequestWithUser } from '../users/user.controller';
import { AuthRole } from '../roles/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiResponse } from 'src/common/api-response';
import { NotificationUsersRequestDto } from './dto/notification-users.request.dto';

// thẳng này sinh ra để test gửi thông báo và lưu token thiết bị, không phải là API chính thức cho client sử dụng
@Controller('v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // cái này là để gửi thật
  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  async sendNotificationToManyUsers(@Body() body: NotificationUsersRequestDto) {
    await this.notificationsService.sendNotificationToUsers(
      body.userIds,
      body.title,
      body.body,
    );
    return ApiResponse.message(
      'Đã gửi lệnh bắn thông báo. Vui lòng xem log Terminal.',
    );
  }

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

    return ApiResponse.message(
      'Đã gửi lệnh bắn thông báo. Vui lòng xem log Terminal.',
    );
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
