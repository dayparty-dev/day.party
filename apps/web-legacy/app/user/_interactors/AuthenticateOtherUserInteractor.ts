import { nanoid } from 'nanoid';

import { AuthSession } from 'app/auth/_models/AuthSession';
import { AuthTokenService } from 'app/auth/_services/AuthTokenService';
import { JsonWebTokenAuthTokenService } from 'app/auth/_services/JsonWebTokenAuthTokenService';
import { getCollection } from 'lib/mongodb';
import { User } from '../_models/User';
import { UserService } from '../_services/UserService';

export interface AuthenticateOtherUserOutput {
  user: User;
  authToken: string;
}

export class AuthenticateOtherUserInteractor {
  constructor(
    private readonly userService: UserService = new UserService(),
    private readonly authTokenService: AuthTokenService = new JsonWebTokenAuthTokenService(),
  ) {}

  public async interact(userId: string): Promise<AuthenticateOtherUserOutput> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const authSession = await this.createAuthSession(user);

    const authToken = this.authTokenService.signToken({
      sessionId: authSession._id,
      email: user.email,
      userId: user._id,
    });

    return {
      user,
      authToken,
    };
  }

  private async createAuthSession({ email, _id: userId }: User): Promise<AuthSession> {
    const collection = await getCollection<AuthSession>('auth_sessions');

    const now = new Date();
    const authSession: AuthSession = {
      _id: nanoid(),
      email,
      _createdAt: now,
      _updatedAt: now,
      isActive: true,
      userId,
    };

    await collection.insertOne(authSession);

    return authSession;
  }
}

export const authenticateOtherUserInteractor = new AuthenticateOtherUserInteractor();
