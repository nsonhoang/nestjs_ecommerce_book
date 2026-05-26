import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { minutes, Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/strategies/current-user.decorator';
import { type RequestWithUser } from '../users/user.controller';
import { AuthRole } from '../roles/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiResponse } from 'src/common/api-response';
import { NotificationUsersRequestDto } from './dto/notification-users.request.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

// thẳng này sinh ra để test gửi thông báo và lưu token thiết bị, không phải là API chính thức cho client sử dụng
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // cái này là để gửi thật
  @ApiOperation({ summary: 'Gửi thông báo cho nhiều user (admin/staff)' })
  @ApiBody({ type: NotificationUsersRequestDto })
  @ApiOkResponse({ description: 'Gửi thông báo thành công' })
  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuthRole.ADMIN, AuthRole.STAFF)
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
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
  @ApiOperation({ summary: 'Test gửi thông báo cho user hiện tại' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({ description: 'Gửi thông báo test thành công' })
  @Post('test-send')
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
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
  @ApiOperation({ summary: 'Đăng ký FCM token cho user hiện tại' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        deviceOs: { type: 'string' },
      },
    },
  })

  //cái này cũng để test thôi
  @ApiOkResponse({ description: 'Đăng ký gửi thông báo thành công' })
  @Post('token')
  @Throttle({ default: { ttl: minutes(1), limit: 20 } })
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
