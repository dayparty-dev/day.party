import { cookies } from 'next/headers';
import { JsonWebTokenAuthTokenService } from '../_services/JsonWebTokenAuthTokenService';
import { redirect } from 'next/navigation';

interface WithAuthOptions {
  redirectToLogin?: boolean;
}

/**
 * Higher-order function that wraps server actions to require authentication
 *
 * @param action The server action to wrap
 * @param options Options for authentication behavior
 * @returns The wrapped server action that checks for authentication
 */
export function withAuth<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: WithAuthOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const { redirectToLogin = false } = options;
    const cookieStore = await cookies();

    // Get authentication token from cookies
    const token = cookieStore.get('day_party_auth_token')?.value;

    if (!token) {
      if (redirectToLogin) {
        redirect('/auth/login');
      }
      throw new Error('Unauthorized: No authentication token provided');
    }

    try {
      const authTokenService = new JsonWebTokenAuthTokenService();
      const authToken = authTokenService.verifyToken({ token });

      // Add auth data to the context for the action to use
      const contextWithAuth = {
        auth: {
          userId: authToken.userId,
          email: authToken.email,
        },
      };

      // Call the original action with the auth context
      return await action(...args, contextWithAuth);
    } catch (error) {
      console.error('Authentication error:', error);
      if (redirectToLogin) {
        redirect('/auth/login');
      }
      throw new Error('Unauthorized: Invalid authentication token');
    }
  };
}
