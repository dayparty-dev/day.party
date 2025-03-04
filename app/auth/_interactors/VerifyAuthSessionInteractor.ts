import { Interactor } from 'app/_models/modules/Interactor';
import { AuthSession } from '../_models/AuthSession';
import { AuthTokenSigningDTO } from '../_models/AuthTokenSigningDTO';
import { AuthTokenService } from '../_services/AuthTokenService';
import { JsonWebTokenAuthTokenService } from '../_services/JsonWebTokenAuthTokenService';
import { getCollection } from 'lib/mongodb';

export interface VerifyAuthSessionInput {
  id: string;
}

export interface VerifyAuthSessionOutput {
  token: string;
}

export class VerifyAuthSessionInteractor
  implements Interactor<VerifyAuthSessionInput, VerifyAuthSessionOutput>
{
  private readonly COLLECTION_NAME = 'auth_sessions';

  constructor(
    private readonly authTokenService: AuthTokenService = new JsonWebTokenAuthTokenService()
  ) {}

  public async interact(
    input: VerifyAuthSessionInput
  ): Promise<VerifyAuthSessionOutput> {
    const authSession = await this.findAuthSession(input);

    const authTokenSigningDTO: AuthTokenSigningDTO = {
      sessionId: authSession._id,
      email: authSession.email,
    };

    const signedToken = this.authTokenService.signToken(authTokenSigningDTO);

    const output = {
      token: signedToken,
    };

    return output;
  }

  private async findAuthSession(
    input: VerifyAuthSessionInput
  ): Promise<AuthSession> {
    try {
      const collection = await getCollection<AuthSession>(this.COLLECTION_NAME);
      const authSession = await collection.findOne({ _id: input.id });

      if (!authSession) {
        throw new Error('Invalid session');
      }

      return authSession;
    } catch (err) {
      throw new Error('Invalid session');
    }
  }
}
