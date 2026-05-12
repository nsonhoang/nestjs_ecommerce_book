import { OmitType } from '@nestjs/mapped-types';
import { NotificationUsersRequestDto } from 'src/modules/notifications/dto/notification-users.request.dto';

export class PromotionNotifyRequestDto extends OmitType(
  NotificationUsersRequestDto,
  ['userIds'] as const,
) {
  // giữ lại các trường title và body để gửi thông báo đến topic "sales"
}
