import { EmailSendInput } from 'models/EmailSendInput';
import { ResendEmailService } from './ResendEmailService';
import { FakeEmailService } from './FakeEmailService';

export interface EmailService {
  sendEmail(emailSendDTO: EmailSendInput): Promise<void>;
}

export const emailService = process.env.EMAIL_RESEND_API_KEY
  ? new ResendEmailService()
  : new FakeEmailService();
