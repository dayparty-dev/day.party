import { EmailSendInput } from 'models/EmailSendInput';
import { ResendEmailService } from './ResendEmailService';
import { FakeEmailService } from './FakeEmailService';

export interface EmailService {
  sendEmail(emailSendDTO: EmailSendInput): Promise<void>;
}

export const getEmailService = () =>
  process.env.EMAIL_RESEND_API_KEY !== undefined
    ? new ResendEmailService()
    : new FakeEmailService();
