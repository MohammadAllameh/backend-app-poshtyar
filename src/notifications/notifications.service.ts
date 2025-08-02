import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class NotificationsService {
  private emailAPI: TransactionalEmailsApi;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'BREVO_API_KEY is missing in environment variables',
      );
    }

    this.emailAPI = new TransactionalEmailsApi();
    this.emailAPI.setApiKey(0, apiKey); // استفاده از متد setApiKey برای تنظیم کلید API
  }

  async sendOtpEmail(
    to: string,
    companyName: string,
    otpCode: string,
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`Starting email send to ${to} at ${new Date().toISOString()}`);

    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'notifications',
        'templates',
        'otp-email.template.html',
      );
      const source = fs.readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(source);
      const html = template({ name: companyName, otpCode });

      const message = new SendSmtpEmail();
      message.subject = 'کد تأیید پشتیار';
      message.htmlContent = html;
      message.sender = { name: 'پشتیار', email: 'support@poshtyar.com' };
      message.to = [{ email: to, name: companyName }];

      const response = await this.emailAPI.sendTransacEmail(message);
      const duration = Date.now() - startTime;
      console.log(
        `Email sent successfully to ${to}. Message ID: ${response.body.messageId}, Duration: ${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `Failed to send email to ${to} after ${duration}ms:`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to send email: ${error.message}`,
      );
    }
  }
}
