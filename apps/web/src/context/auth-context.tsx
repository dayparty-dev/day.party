import { DayPartyClient } from '@dayparty/api-client';
import { ERROR_CODES } from '@dayparty/core';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { API_BASE_URL } from '../config';
import { clearSessionToken, readSessionToken, writeSessionToken } from '../utils/session-token-storage';

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
};

type AuthContextValue = {
  client: DayPartyClient;
  user: AuthUser | null;
  /** True after we finish reading `localStorage` and optional `/auth/me` hydration. */
  authReady: boolean;
  isAuthenticated: boolean;
  login: (email: string) => ReturnType<DayPartyClient['login']>;
  verifyFromToken: (magicToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  onUnauthorized: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const client = useMemo(() => new DayPartyClient({ baseUrl: API_BASE_URL }), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = readSessionToken();
      if (stored) {
        client.setToken(stored);
        const meRes = await client.me();
        if (cancelled) {
          return;
        }
        if (meRes.ok) {
          setUser(meRes.data);
        } else {
          clearSessionToken();
          client.clearToken();
        }
      }
      if (!cancelled) {
        setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const isAuthenticated = user !== null;

  const onUnauthorized = useCallback(() => {
    clearSessionToken();
    client.clearToken();
    setUser(null);
    navigate('/login', { replace: true });
  }, [client, navigate]);

  const login = useCallback(
    async (email: string) => {
      return client.login(email);
    },
    [client],
  );

  const verifyFromToken = useCallback(
    async (magicToken: string) => {
      const result = await client.verify(magicToken);
      if (!result.ok) {
        return false;
      }
      const session = client.getToken();
      if (session) {
        writeSessionToken(session);
      }
      setUser(result.data.user);
      return true;
    },
    [client],
  );

  const logout = useCallback(async () => {
    const result = await client.logout();
    if (!result.ok && result.error.code === ERROR_CODES.UNAUTHORIZED) {
      onUnauthorized();
      return;
    }
    clearSessionToken();
    client.clearToken();
    setUser(null);
    navigate('/login', { replace: true });
  }, [client, navigate, onUnauthorized]);

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      user,
      authReady,
      isAuthenticated,
      login,
      verifyFromToken,
      logout,
      onUnauthorized,
    }),
    [client, user, authReady, isAuthenticated, login, verifyFromToken, logout, onUnauthorized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
