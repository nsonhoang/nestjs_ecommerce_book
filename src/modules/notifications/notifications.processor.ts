import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService } from './notifications.service';

@Processor('notifications-queue', {
  concurrency: 5, // Số lượng công việc có thể được xử lý đồng thời
  limiter: {
    max: 10, // Số lượng công việc tối đa được xử lý trong một khoảng thời gian
    duration: 1000, // Khoảng thời gian (ms) để giới hạn số lượng công việc
  },
})
export class NotificationsProcessor extends WorkerHost {
  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<{ userId: string; title: string; body: string }>) {
    if (job.name === 'send-notification') {
      const { userId, title, body } = job.data;
      await this.notificationsService.sendNotificationToUser(
        userId,
        title,
        body,
      );
    }
  }
}
