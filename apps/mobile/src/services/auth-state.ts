import { DayPartyClient, type Result } from '@dayparty/api-client';
import { ERROR_CODES } from '@dayparty/core';
import { SecureStorage } from '@nativescript/secure-storage';
import { Frame } from '@nativescript/core';

import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'bearer_token';
const SERVICE = 'org.dayparty.mobile';

/**
 * Singleton auth + API client wiring (no Zustand — per plan).
 * Persists bearer token with {@link SecureStorage}.
 */
class AuthStateService {
  private readonly storage = new SecureStorage();
  private readonly client: DayPartyClient;

  constructor() {
    this.client = new DayPartyClient({ baseUrl: API_BASE_URL });
  }

  hydrateFromStorage(): void {
    try {
      const token = this.storage.getSync({ key: TOKEN_KEY, service: SERVICE });
      if (typeof token === 'string' && token.length > 0) {
        this.client.setToken(token);
      }
    } catch {
      /* no prior session */
    }
  }

  isAuthenticated(): boolean {
    return this.client.getToken() !== null;
  }

  getClient(): DayPartyClient {
    return this.client;
  }

  navigateToLogin(clearHistory = true): void {
    Frame.topmost()?.navigate({
      moduleName: 'views/login-view',
      clearHistory,
      animated: true,
    });
  }

  navigateToRundown(clearHistory = false): void {
    Frame.topmost()?.navigate({
      moduleName: 'views/rundown-view',
      clearHistory,
      animated: true,
    });
  }

  navigateToOngoing(): void {
    Frame.topmost()?.navigate({
      moduleName: 'views/ongoing-view',
      clearHistory: false,
      animated: true,
    });
  }

  navigateToTaskDetail(taskId: string, options?: { notesFocus?: boolean }): void {
    Frame.topmost()?.navigate({
      moduleName: 'views/task-detail-view',
      context: { taskId, notesFocus: options?.notesFocus === true },
      clearHistory: false,
      animated: true,
    });
  }

  async login(email: string): Promise<Result<{ message: string }>> {
    return this.client.login(email);
  }

  async verifyMagicLinkToken(token: string) {
    const result = await this.client.verify(token);
    if (result.ok === true) {
      this.storage.setSync({ key: TOKEN_KEY, service: SERVICE, value: result.data.token });
    }
    return result;
  }

  async logout(): Promise<Result<{ message: string }>> {
    const result = await this.client.logout();
    try {
      this.storage.removeSync({ key: TOKEN_KEY, service: SERVICE });
    } catch {
      /* ignore */
    }
    this.client.clearToken();
    this.navigateToLogin(true);
    return result;
  }

  /** Used when API returns 401 — clear vault and return to login without calling logout route. */
  clearSessionAndGoToLogin(): void {
    try {
      this.storage.removeSync({ key: TOKEN_KEY, service: SERVICE });
    } catch {
      /* ignore */
    }
    this.client.clearToken();
    this.navigateToLogin(true);
  }

  /**
   * If the API signalled UNAUTHORIZED, clears session and navigates to login.
   * @returns true when this happened (caller should stop processing).
   */
  consumeUnauthorized<T>(result: Result<T>): boolean {
    if (result.ok === true) {
      return false;
    }
    if (result.error.code === ERROR_CODES.UNAUTHORIZED) {
      this.clearSessionAndGoToLogin();
      return true;
    }
    return false;
  }
}

export const authState = new AuthStateService();
