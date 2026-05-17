import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
      debug: true, // Enable debug output
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {} //cái này dùng để custom

  //không gửi token  mà gửi otp hợp lí hơn // gắn 1 token - otp  token để path url ứng với otp đấy
  async sendMailVerifyEmail(to: string, otp: string) {
    // cái này dùng để gửi mail xác nhận email khi đăng kí tài khoản mới hoặc

    const fileName = 'confirm-mail.hbs';

    const candidates = [
      path.join(__dirname, 'template', fileName), // prod nếu assets nằm cạnh JS
      path.join(process.cwd(), 'dist', 'modules', 'mail', 'template', fileName), // trường hợp assets nằm ở dist/modules
      path.join(process.cwd(), 'src', 'modules', 'mail', 'template', fileName), // dev chạy ts trực tiếp
    ];

    const templatePath = candidates.find((p) => fs.existsSync(p));
    if (!templatePath)
      throw new Error(`Template not found: ${candidates.join(' | ')}`);

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    // const verifyLink = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`; // link nay la ben fontend
    const htmlSend = template({ otp });
    const mailOptions: MailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to,
      subject: 'Xác nhận email',
      text: `Vui lòng sử dụng mã OTP sau để xác nhận email của bạn: ${otp}`,
      html: htmlSend,
    };
    await this.transporter.sendMail(mailOptions);
  }
  // cái này là để validate quên mật khẩu // cũng tương tự là gửi mã otp về chứ không gửi token
  async sendMailValidateResetPassword(to: string, otp: string) {
    try {
      console.log('Sending reset password email to:', to); // Debug: log recipient email
      const fileName = 'reset-password.mail.hbs';

      const candidates = [
        path.join(__dirname, 'template', fileName), // prod nếu assets nằm cạnh JS
        path.join(
          process.cwd(),
          'dist',
          'modules',
          'mail',
          'template',
          fileName,
        ), // trường hợp assets nằm ở dist/modules
        path.join(
          process.cwd(),
          'src',
          'modules',
          'mail',
          'template',
          fileName,
        ), // dev chạy ts trực tiếp
      ];

      const templatePath = candidates.find((p) => fs.existsSync(p));
      if (!templatePath)
        throw new Error(`Template not found: ${candidates.join(' | ')}`);

      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(templateSource);

      // const resetPasswordLink = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
      const htmlSend = template({ otp });
      console.log('mailfrom env:', this.configService.get<string>('MAIL_FROM')); // Debug: log mail from config
      const mailOptions: MailOptions = {
        from: this.configService.get<string>('MAIL_FROM'),
        to,
        subject: 'Xác nhận yêu cầu đặt lại mật khẩu',
        text: `Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP sau để đặt lại mật khẩu của bạn: ${otp}`,
        html: htmlSend,
      };
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${to}: ${error}`,
      );
    }
  }
}
