import {
  deleteCookie as deleteClientCookie,
  getCookie as getClientCookie,
  setCookie as setClientCookie,
} from 'cookies-next';

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
