'use server';

import { withAuth } from 'app/auth/_middleware/withAuth';
import {
  authenticateOtherUserInteractor,
  AuthenticateOtherUserOutput,
} from 'app/user/_interactors/AuthenticateOtherUserInteractor';
import { User, UserRole } from 'app/user/_models/User';
import { getUserService } from 'app/user/_services/UserService';

export const searchUsersServer = withAuth(async (ctx, searchUserQuery: string): Promise<User[]> => {
  const { userId, role } = ctx.auth;

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  if (role !== UserRole.Admin) {
    throw new Error('Unauthorized: User not authorized');
  }

  const userService = getUserService();

  const users = await userService.search(searchUserQuery);

  return users;
});

export const updateUserRole = withAuth(async (ctx, updatedUserId: string, updatedUserRole: UserRole): Promise<void> => {
  const { userId, role } = ctx.auth;

  if (!userId) {
    throw new Error('Unauthorized: User not authenticated');
  }

  if (role !== UserRole.Admin) {
    throw new Error('Unauthorized: User not authorized');
  }

  const userService = getUserService();

  await userService.updateUserRole(updatedUserId, updatedUserRole);
});

export const authenticateOtherUser = withAuth(
  async (ctx, otherUserId: string): Promise<AuthenticateOtherUserOutput> => {
    const { userId, role } = ctx.auth;

    if (!userId) {
      throw new Error('Unauthorized: User not authenticated');
    }

    if (role !== UserRole.Admin) {
      throw new Error('Unauthorized: User not authorized');
    }

    const output = await authenticateOtherUserInteractor.interact(otherUserId);

    return output;
  },
);
