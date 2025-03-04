import { nanoid } from 'nanoid';
import dedent from 'dedent-tabs';
import { ObjectId } from 'mongodb';

import { Interactor } from 'app/_models/modules/Interactor';
import { AuthSession } from '../_models/AuthSession';
import { EmailService, getEmailService } from '_services/EmailService';
import { EmailMessage } from 'app/_models/EmailMessage';
import { EmailSendInput } from 'app/_models/EmailSendInput';
import { getCollection } from 'lib/mongodb';

export interface CreateAuthSessionInput {
  email: string;
}

export interface CreateAuthSessionOutput {
  email: string;
}

export class CreateAuthSessionInteractor
  implements Interactor<CreateAuthSessionInput, CreateAuthSessionOutput>
{
  private readonly BASE_URL: string;
  private readonly COLLECTION_NAME = 'auth_sessions';

  constructor(
    env = process.env,
    private readonly emailService: EmailService = getEmailService()
  ) {
    if (env.BASE_URL) {
      this.BASE_URL = env.BASE_URL;
    } else if (env.VERCEL_PROJECT_PRODUCTION_URL) {
      this.BASE_URL = `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else {
      this.BASE_URL = 'http://localhost:3000';
    }
  }

  public async interact(
    input: CreateAuthSessionInput
  ): Promise<CreateAuthSessionOutput> {
    const { email: originalEmail } = input;

    if (this.isValidEmail(originalEmail)) {
      const authSession = await this.createAuthSession(originalEmail);

      const loginLink = this.generateLoginLink(authSession);

      const emailMessage = this.generateLoginEmailMessage(loginLink);

      await this.sendEmailMessage(authSession.email, emailMessage);

      const output: CreateAuthSessionOutput = {
        email: authSession.email,
      };

      return output;
    }
  }

  private isValidEmail(email: string): true | never {
    let isValid: boolean = true; // TODO: check if email is valid

    if (!isValid) {
      throw new Error('Invalid email');
    }

    return isValid;
  }

  private async createAuthSession(email: string): Promise<AuthSession> {
    const collection = await getCollection<AuthSession>(this.COLLECTION_NAME);

    const now = new Date();
    const authSession: AuthSession = {
      _id: new ObjectId().toString(),
      email,
      _createdAt: now,
      _updatedAt: now,
    };

    await collection.insertOne(authSession);

    return authSession;
  }

  private generateLoginLink(authSession: AuthSession): string {
    const emailLink = `${this.BASE_URL}/auth/login?sessionId=${authSession._id}`;

    return emailLink;
  }

  private generateLoginEmailMessage(emailLink: string): EmailMessage {
    const text = dedent`
      Hola,

      Te mandamos este correo electrónico porque has intentado iniciar sesión en day.party.

      Accede al siguiente enlace en tu navegador para continuar con el inicio de sesión:

      ${emailLink}

      ¿No has sido tú? Ignora el enlace y avísanos con un correo a dayparty.dev@gmail.com.`;

    const html = dedent`
      <p>Hola,</p>

      <p>Te mandamos este correo electrónico porque has intentado iniciar sesión en day.party.

      <p>Haz clic en el siguiente enlace o cópialo y pégalo en la barra de direcciones de tu navegador para continuar con el inicio de sesión:<p>

      <p>
        <strong><a href="${emailLink}">${emailLink}</a></strong>
      </p>
      
      <p>¿No has sido tú? Ignora el enlace y avísanos con un correo a <a href="mailto:dayparty.dev@gmail.com">dayparty.dev@gmail.com</a>.</p>`;

    const emailMessage: EmailMessage = {
      subject: 'Iniciar sesión en day.party',
      html,
      text,
    };

    return emailMessage;
  }

  private async sendEmailMessage(
    email: string,
    emailMessage: EmailMessage
  ): Promise<void> {
    const emailSendInput: EmailSendInput = {
      to: email,
      message: emailMessage,
    };

    try {
      await this.emailService.sendEmail(emailSendInput);
    } catch (err) {
      throw new Error(`Login email cannot be sent: ${err.message}`);
    }
  }
}
