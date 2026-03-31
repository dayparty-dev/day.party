import { DayPartyClient } from '@dayparty/api-client';
import { ERROR_CODES } from '@dayparty/core';
import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { API_BASE_URL } from '../config';

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
};

type AuthContextValue = {
  client: DayPartyClient;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string) => ReturnType<DayPartyClient['login']>;
  verifyFromToken: (magicToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  onUnauthorized: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const navigate = useNavigate();
  const tokenRef = useRef<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [epoch, setEpoch] = useState(0);

  const client = useMemo(() => new DayPartyClient({ baseUrl: API_BASE_URL }), []);

  const bump = useCallback(() => {
    setEpoch((e) => e + 1);
  }, []);

  void epoch;
  const isAuthenticated = tokenRef.current !== null;

  const onUnauthorized = useCallback(() => {
    tokenRef.current = null;
    client.clearToken();
    setUser(null);
    bump();
    navigate('/login', { replace: true });
  }, [bump, client, navigate]);

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
      tokenRef.current = client.getToken();
      setUser(result.data.user);
      bump();
      return true;
    },
    [bump, client],
  );

  const logout = useCallback(async () => {
    const result = await client.logout();
    if (!result.ok && result.error.code === ERROR_CODES.UNAUTHORIZED) {
      onUnauthorized();
      return;
    }
    tokenRef.current = null;
    setUser(null);
    bump();
    navigate('/login', { replace: true });
  }, [bump, client, navigate, onUnauthorized]);

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      user,
      isAuthenticated,
      login,
      verifyFromToken,
      logout,
      onUnauthorized,
    }),
    [client, user, isAuthenticated, login, verifyFromToken, logout, onUnauthorized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
