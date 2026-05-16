import { Module } from '@nestjs/common';
import { MailService } from './mail.serivce';
import { BullModule } from '@nestjs/bullmq';
import { MailProcessor } from './mail.process';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail_queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService, BullModule],
})
export class MailModule {}
