import { CookieName } from 'app/_services/cookieNames';
import { clientCookies } from 'app/_services/cookieService';
import { UserRole } from 'app/user/_models/User';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect, useState } from 'react';
import createPersistedState from 'use-persisted-state';
import { AuthTokenJwt } from '../_models/AuthTokenJwt';
import { createAuthSessionServer, deleteAuthSessionServer, verifyAuthSessionServer } from './authActions';

interface UseAuthUser {
  id: string;
  role: UserRole;
}

const useSessionIdState = createPersistedState('day.party.auth.sessionId');
const useIsLoggedInState = createPersistedState('day.party.auth.isLoggedIn');
const useUserState = createPersistedState('day.party.auth.user');

const getAuthToken = () => clientCookies.get(CookieName.AuthToken);
const setAuthToken = (token: string) => clientCookies.set(CookieName.AuthToken, token);
const deleteAuthToken = () => clientCookies.delete(CookieName.AuthToken);

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
    return typeof window !== 'undefined' ? getAuthToken() || null : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useIsLoggedInState<boolean>(false);
  const [user, setUser] = useUserState<UseAuthUser>(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode<AuthTokenJwt>(token);

        const newUser: UseAuthUser = {
          id: decodedToken.userId,
          role: decodedToken.role ?? UserRole.Standard,
        };

        setUser(newUser);
        setIsLoggedIn(true);
      } catch (error) {
        setToken(null);
        deleteAuthToken();
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

  const verifyLoginLink = useCallback(async (candidateSessionId: string): Promise<void> => {
    console.log('verifyLoginLink', candidateSessionId);
    try {
      const { token } = await verifyAuthSessionServer({
        id: candidateSessionId,
      });

      // Store token in cookies for server access
      setAuthToken(token);

      setToken(token);
      setSessionId(candidateSessionId);
      setIsLoggedIn(true);
    } catch (error) {
      throw new Error(error);
    }
  }, []);

  const clearState = useCallback(() => {
    setSessionId(null);
    deleteAuthToken();
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
