import { EmailService } from './EmailService';
import { EmailSendInput } from 'app/_models/EmailSendInput';

export class FakeEmailService implements EmailService {
  public async sendEmail(emailSendInput: EmailSendInput): Promise<void> {
    console.log('Email sent:');
    console.log(JSON.stringify(emailSendInput));
  }
}
