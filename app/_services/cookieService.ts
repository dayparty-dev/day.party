import {
  deleteCookie as deleteClientCookie,
  getCookie as getClientCookie,
  setCookie as setClientCookie,
} from 'cookies-next';
import { cookies } from 'next/headers';

const DEFAULT_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60, // 30 days
  path: '/',
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
};

// Client-side cookie operations
export const clientCookies = {
  get: (name: string) => getClientCookie(name) as string | null,
  set: (name: string, value: string, options = {}) => setClientCookie(name, value, { ...DEFAULT_OPTIONS, ...options }),
  delete: (name: string) => deleteClientCookie(name, { path: '/' }),
};

// Server-side cookie operations
export const serverCookies = {
  get: async (name: string) => {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value || null;
  },
};

// Enum for cookie names
export enum CookieName {
  AuthToken = 'dayparty:auth_token',
  Theme = 'dayparty:theme',
}
