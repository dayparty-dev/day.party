import { Interactor } from 'app/_models/modules/Interactor';
import { AuthSession } from '../_models/AuthSession';
import { AuthTokenSigningInput } from '../_models/AuthTokenSigningInput';
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

    const authTokenSigningDTO: AuthTokenSigningInput = {
      sessionId: authSession._id,
      email: authSession.email,
    };

    const signedToken = this.authTokenService.signToken(authTokenSigningDTO);

    await this.invalidateSession(authSession);

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
      const authSession = await collection.findOne({ _id: input.id, isActive: false });

      if (!authSession) {
        throw new Error('Invalid session');
      }

      return authSession;
    } catch (err) {
      throw new Error('Invalid session');
    }
  }

  /* Invalidate session used for signedToken */
  private async invalidateSession(
    session: AuthSession
  ): Promise<void> {
    try {
      const collection = await getCollection<AuthSession>(this.COLLECTION_NAME);
      const result = await collection.updateOne(
        { _id: session._id },
        { $set: { isActive: true } }
      );
  
      if (result.modifiedCount === 0) {
        throw new Error('Failed to invalidate session');
      }
    } catch (err) {
      throw new Error('Error invalidating session');
    }
  }
}