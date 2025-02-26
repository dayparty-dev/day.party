import { Resend } from 'resend';

import { EmailService } from './EmailService';
import { EmailSendInput } from 'models/EmailSendInput';

export class ResendEmailService implements EmailService {
  private resend: Resend;
  private sendFrom: string;

  constructor() {
    const apiKey = process.env.EMAIL_RESEND_API_KEY;
    const sendFrom = process.env.EMAIL_SENDER_ADDRESS;

    if (!apiKey) {
      throw new Error('EMAIL_RESEND_API_KEY environment variable is not set');
    }

    if (!sendFrom) {
      throw new Error('EMAIL_SENDER_ADDRESS environment variable is not set');
    }

    this.resend = new Resend(apiKey);
    this.sendFrom = sendFrom;
  }

  public async sendEmail(emailSendInput: EmailSendInput): Promise<void> {
    try {
      const { to, message } = emailSendInput;
      const { subject, html, text } = message;

      await this.resend.emails.send({
        from: this.sendFrom,
        to,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send email via Resend:', error);

      throw new Error('Failed to send email');
    }
  }
}
