import { CookieName } from 'app/_services/cookieNames';
import { serverCookies } from 'app/_services/serverCookieService';
import { UserRole } from 'app/user/_models/User';
import { redirect } from 'next/navigation';
import { JsonWebTokenAuthTokenService } from '../_services/JsonWebTokenAuthTokenService';

interface WithAuthOptions {
  redirectToLogin?: boolean;
}

export type AuthContext = {
  auth: {
    userId: string;
    email: string;
    role: UserRole;
  };
};

/**
 * Higher-order function that wraps server actions to require authentication
 *
 * @param action The server action to wrap
 * @param options Options for authentication behavior
 * @returns The wrapped server action that checks for authentication
 */
export function withAuth<T extends (ctx: AuthContext, ...args: any[]) => Promise<any>>(
  action: T,
  options: WithAuthOptions = {},
): (...args: OmitFirstParam<Parameters<T>>) => Promise<ReturnType<T>> {
  return async (...args: OmitFirstParam<Parameters<T>>): Promise<ReturnType<T>> => {
    const { redirectToLogin = false } = options;

    // Get authentication token from cookies
    const token = await serverCookies.get(CookieName.AuthToken);

    if (!token) {
      if (redirectToLogin) {
        redirect('/auth/login');
      }
      throw new Error('Unauthorized: No authentication token provided');
    }

    try {
      const authTokenService = new JsonWebTokenAuthTokenService();
      const authToken = authTokenService.verifyToken({ token });

      // Create the auth context
      const contextWithAuth: AuthContext = {
        auth: {
          userId: authToken.userId,
          email: authToken.email,
          role: authToken.role,
        },
      };

      // Call the original action with the injected context
      return await action(contextWithAuth, ...args);
    } catch (error) {
      console.error('Authentication error:', error);
      if (redirectToLogin) {
        redirect('/auth/login');
      }
      throw new Error('Unauthorized: Invalid authentication token');
    }
  };
}

// Utility type to omit the first parameter of a function
type OmitFirstParam<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;
