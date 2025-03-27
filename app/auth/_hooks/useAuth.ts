import { jwtDecode } from 'jwt-decode';
import { useEffect, useCallback, useState } from 'react';
import createPersistedState from 'use-persisted-state';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import {
  createAuthSessionServer,
  deleteAuthSessionServer,
  verifyAuthSessionServer,
} from './authActions';
import { AuthTokenJwt } from '../_models/AuthTokenJwt';

interface UseAuthUser {
  id: string;
}

const useSessionIdState = createPersistedState('day.party.auth.sessionId');
const useIsLoggedInState = createPersistedState('day.party.auth.isLoggedIn');
const useUserState = createPersistedState('day.party.auth.user');

const AUTH_TOKEN_COOKIE = 'day_party_auth_token';
const COOKIE_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60, // 30 days
  path: '/',
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
};

export interface UseAuth {
  isLoggedIn: boolean;
  token: string | null;
  user: UseAuthUser | null;
  sendLoginLink(email: string): Promise<void>;
  verifyLoginLink(candidateSessionId: string): Promise<void>;
  logout(): Promise<void>;
  clearState(): void;
}

export function useAuth(): UseAuth {
  const [sessionId, setSessionId] = useSessionIdState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined'
      ? (getCookie(AUTH_TOKEN_COOKIE) as string) || null
      : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useIsLoggedInState<boolean>(false);
  const [user, setUser] = useUserState<UseAuthUser>(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode<AuthTokenJwt>(token);

        const newUser: UseAuthUser = {
          id: decodedToken.userId,
        };

        setUser(newUser);
        setIsLoggedIn(true);
      } catch (error) {
        setToken(null);
        deleteCookie(AUTH_TOKEN_COOKIE);
      }
    } else {
      setUser(null);
      setIsLoggedIn(false);
    }
  }, [token]);

  const sendLoginLink = useCallback(async (email: string): Promise<void> => {
    await createAuthSessionServer({
      email,
    });
  }, []);

  const verifyLoginLink = useCallback(
    async (candidateSessionId: string): Promise<void> => {
      console.log('verifyLoginLink', candidateSessionId);
      try {
        const { token } = await verifyAuthSessionServer({
          id: candidateSessionId,
        });

        // Store token in cookies for server access
        setCookie(AUTH_TOKEN_COOKIE, token, COOKIE_OPTIONS);

        setToken(token);
        setSessionId(candidateSessionId);
        setIsLoggedIn(true);
      } catch (error) {
        throw new Error(error);
      }
    },
    []
  );

  const clearState = useCallback(() => {
    setSessionId(null);
    deleteCookie(AUTH_TOKEN_COOKIE);
    setToken(null);
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    if (token) {
      await deleteAuthSessionServer({
        token,
      });

      clearState();
    }
  }, [token, clearState]);

  return {
    isLoggedIn,
    token,
    user,
    sendLoginLink,
    verifyLoginLink,
    logout,
    clearState,
  };
}
