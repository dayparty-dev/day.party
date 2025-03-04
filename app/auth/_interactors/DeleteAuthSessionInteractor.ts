import { Interactor } from 'app/_models/modules/Interactor';
import { AuthSession } from '../_models/AuthSession';
import { JsonWebTokenAuthTokenService } from '../_services/JsonWebTokenAuthTokenService';
import { getCollection } from 'lib/mongodb';

export interface DeleteAuthSessionInput {
  token: string;
}

export type DeleteAuthSessionOutput = void;

export class DeleteAuthSessionInteractor
  implements Interactor<DeleteAuthSessionInput, DeleteAuthSessionOutput>
{
  private readonly COLLECTION_NAME = 'auth_sessions';

  constructor(
    private readonly authTokenService = new JsonWebTokenAuthTokenService()
  ) {}

  public async interact(
    input: DeleteAuthSessionInput
  ): Promise<DeleteAuthSessionOutput> {
    const { token } = input;

    const authSession = await this.extractAuthSessionFromToken(token);

    await this.deleteAuthSession(authSession);
  }

  private async extractAuthSessionFromToken(
    token: string
  ): Promise<AuthSession> {
    const { sessionId: authSessionId } =
      await this.authTokenService.verifyToken({ token });

    const collection = await getCollection<AuthSession>(this.COLLECTION_NAME);
    const authSession = await collection.findOne({ _id: authSessionId });

    if (!authSession) {
      throw new Error('Auth session not found');
    }

    return authSession;
  }

  private async deleteAuthSession(authSession: AuthSession): Promise<void> {
    const collection = await getCollection<AuthSession>(this.COLLECTION_NAME);
    await collection.deleteOne({ _id: authSession._id });
  }
}
