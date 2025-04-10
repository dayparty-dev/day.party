// useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { jwtDecode } from 'jwt-decode';
import { AuthTokenJwt } from '../_models/AuthTokenJwt';
import { createAuthSessionServer, deleteAuthSessionServer, verifyAuthSessionServer } from './../_hooks/authActions';

const AUTH_TOKEN_COOKIE = 'day_party_auth_token';
const COOKIE_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60,
  path: '/',
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
};

interface UseAuthUser {
  id: string;
}

interface AuthState {
  token: string | null;
  user: UseAuthUser | null;
  isLoggedIn: boolean;
  sendLoginLink: (email: string) => Promise<void>;
  verifyLoginLink: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
  clearState: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: (typeof window !== 'undefined' ? (getCookie(AUTH_TOKEN_COOKIE) as string) : null) || null,
      user: null,
      isLoggedIn: false,

      sendLoginLink: async (email: string) => {
        await createAuthSessionServer({ email });
      },

      verifyLoginLink: async (candidateSessionId: string) => {
        const { token } = await verifyAuthSessionServer({ id: candidateSessionId });

        setCookie(AUTH_TOKEN_COOKIE, token, COOKIE_OPTIONS);

        const decoded = jwtDecode<AuthTokenJwt>(token);

        set({
          token,
          user: { id: decoded.userId },
          isLoggedIn: true,
        });
      },

      logout: async () => {
        const { token } = get();
        if (token) {
          await deleteAuthSessionServer({ token });
        }
        get().clearState();
      },

      clearState: () => {
        set({
          token: null,
          user: null,
          isLoggedIn: false,
        });
        deleteCookie(AUTH_TOKEN_COOKIE);
      },
    }),
    {
      name: 'day.party.auth',
    }
  )
);
