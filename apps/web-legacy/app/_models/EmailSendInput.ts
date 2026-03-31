import { EmailMessage } from './EmailMessage';

export interface EmailSendInput {
  to: string;
  message: EmailMessage;
}
