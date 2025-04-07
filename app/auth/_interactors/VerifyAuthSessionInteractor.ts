import { Interactor } from 'app/_models/modules/Interactor';
import { UserService, getUserService } from 'app/user/_services/UserService';
import { getCollection } from 'lib/mongodb';
import { AuthSession } from '../_models/AuthSession';
import { AuthTokenSigningInput } from '../_models/AuthTokenSigningInput';
import { AuthTokenService } from '../_services/AuthTokenService';
import { JsonWebTokenAuthTokenService } from '../_services/JsonWebTokenAuthTokenService';

export interface VerifyAuthSessionInput {
  id: string;
}

export interface VerifyAuthSessionOutput {
  token: string;
}

export class VerifyAuthSessionInteractor implements Interactor<VerifyAuthSessionInput, VerifyAuthSessionOutput> {
  private readonly COLLECTION_NAME = 'auth_sessions';

  constructor(
    private readonly authTokenService: AuthTokenService = new JsonWebTokenAuthTokenService(),
    private readonly userService: UserService = getUserService(),
  ) {}

  public async interact(input: VerifyAuthSessionInput): Promise<VerifyAuthSessionOutput> {
    const authSession = await this.findAuthSession(input);

    // Find or create user
    let user = await this.userService.findByEmail(authSession.email);

    if (!user) {
      // Create a new user with username derived from email
      const username = authSession.email.split('@')[0];

      user = await this.userService.createUser(authSession.email, username);
    }

    // Update session with userId
    await this.updateSessionWithUserId(authSession._id, user._id);

    const authTokenSigningDTO: AuthTokenSigningInput = {
      sessionId: authSession._id,
      email: authSession.email,
      userId: user._id,
      role: user.role,
    };

    const signedToken = this.authTokenService.signToken(authTokenSigningDTO);

    await this.invalidateSession(authSession);

    const output = {
      token: signedToken,
    };

    return output;
  }

  private async findAuthSession(input: VerifyAuthSessionInput): Promise<AuthSession> {
    try {
      const collection = await getCollection<AuthSession>(this.COLLECTION_NAME);

      // First check if the session exists at all
      const sessionExists = await collection.findOne({
        _id: input.id,
      });

      if (!sessionExists) {
        throw new Error('Session not found');
      }

      // Then check if it's already been used
      if (sessionExists.isActive) {
        throw new Error('Session already used');
      }

      // Now get the valid inactive session
      const authSession = await collection.findOne({
        _id: input.id,
        isActive: false,
      });

      if (!authSession) {
        throw new Error('Invalid session');
      }

      return authSession;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Invalid session');
    }
  }

  // Add new method to update session with userId
  private async updateSessionWithUserId(sessionId: string, userId: string): Promise<void> {
    try {
      const collection = await getCollection<AuthSession>(this.COLLECTION_NAME);

      await collection.updateOne({ _id: sessionId }, { $set: { userId } });
    } catch (err) {
      throw new Error('Error updating session with userId');
    }
  }

  /* Invalidate session used for signedToken */
  private async invalidateSession(session: AuthSession): Promise<void> {
    try {
      const collection = await getCollection<AuthSession>(this.COLLECTION_NAME);
      const result = await collection.updateOne({ _id: session._id }, { $set: { isActive: true } });

      if (result.modifiedCount === 0) {
        throw new Error('Failed to invalidate session');
      }
    } catch (err) {
      throw new Error('Error invalidating session');
    }
  }
}
