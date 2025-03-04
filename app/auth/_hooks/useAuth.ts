import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useEffect } from 'react';
import createPersistedState from 'use-persisted-state';
import {
  createAuthSessionServer,
  deleteAuthSessionServer,
  verifyAuthSessionServer,
} from './authActions';

interface UseAuthUser {
  id: string;
}

const useSessionIdState = createPersistedState('day.party.auth.sessionId');
const useTokenState = createPersistedState('day.party.auth.token');
const useIsLoggedInState = createPersistedState('day.party.auth.isLoggedIn');
const useUserState = createPersistedState('day.party.auth.user');

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
  const [token, setToken] = useTokenState<string | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useIsLoggedInState<boolean>(false);
  const [user, setUser] = useUserState<UseAuthUser>(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode<JwtPayload>(token);

        const id = decodedToken.sub as string;

        const newUser: UseAuthUser = {
          id: decodedToken.sub as string,
        };

        setUser(newUser);
        setIsLoggedIn(true);
      } catch (error) {
        setToken(null);
      }
    } else {
      setUser(null);
      setIsLoggedIn(false);
    }
  }, [token]);

  async function sendLoginLink(email: string): Promise<void> {
    await createAuthSessionServer({
      email,
    });
  }

  async function verifyLoginLink(candidateSessionId: string): Promise<void> {
    try {
      const { token } = await verifyAuthSessionServer({
        id: candidateSessionId,
      });

      setToken(token);
      setSessionId(candidateSessionId);
      setIsLoggedIn(true);
    } catch (error) {
      throw new Error(error);
    }
  }

  async function logout(): Promise<void> {
    if (token) {
      await deleteAuthSessionServer({
        token,
      });

      clearState();
    }
  }

  function clearState() {
    setSessionId(null);
    setToken(null);
    setIsLoggedIn(false);
    setUser(null);
  }

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
