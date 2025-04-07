import { cookies } from 'next/headers';
import { AuthToken } from '../_models/AuthToken';
import { JsonWebTokenAuthTokenService } from '../_services/JsonWebTokenAuthTokenService';

const AUTH_COOKIE_NAME = 'day_party_auth_token';

/**
 * Gets the current user ID from the auth token in cookies
 * For use in server components and server actions
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const authTokenService = new JsonWebTokenAuthTokenService();
    const authToken = authTokenService.verifyToken({ token });

    return authToken.userId;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

/**
 * Gets the full auth token from cookies
 * For use in server components and server actions
 */
export async function getAuthToken(): Promise<AuthToken | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const authTokenService = new JsonWebTokenAuthTokenService();
    return authTokenService.verifyToken({ token });
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}
