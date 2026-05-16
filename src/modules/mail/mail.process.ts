import { Processor, WorkerHost } from '@nestjs/bullmq';
import { MailService } from './mail.serivce';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

interface SendMailJobData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}
interface SendMailVerifyEmailJobData {
  to: string;
  token: string;
  otp: string;
}

@Processor('mail_queue')
export class MailProcessor extends WorkerHost {
  // định nghĩa các job handler ở đây
  private readonly logger = new Logger(MailProcessor.name);
  constructor(private mailService: MailService) {
    super();
  }
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'send-mail': {
        const { to, subject, text, html } = job.data as SendMailJobData;
        await this.mailService.sendMail(to, subject, text, html);
        break;
      }
      case 'send-mail-verify-email': {
        const { to, token, otp } = job.data as SendMailVerifyEmailJobData;
        await this.mailService.sendMailVerifyEmail(to, otp);
        break;
      }
      case 'send-reset-password-mail': {
        const { to, otp, token } = job.data as SendMailVerifyEmailJobData;
        console.log('Processing reset password email job for:', to); // Debug: log recipient email
        await this.mailService.sendMailValidateResetPassword(to, otp);
        break;
      }
      default:
        this.logger.warn(`Received job with unknown name: ${job.name}`);
    }
  }
}
