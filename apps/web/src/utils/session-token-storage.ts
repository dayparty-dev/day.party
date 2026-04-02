/** Persisted bearer token for `/api/auth/me` and authenticated routes (SPA refresh). */
export const SESSION_TOKEN_STORAGE_KEY = 'dayparty.sessionToken';

export function readSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeSessionToken(token: string): void {
  try {
    localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
  } catch {
    /* private mode / quota */
  }
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
