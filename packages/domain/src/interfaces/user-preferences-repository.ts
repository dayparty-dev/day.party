import type { UserPreferences } from '@dayparty/core';

export interface UserPreferencesRepository {
  findByUserId(userId: string): Promise<UserPreferences | null>;
  /** Insert or replace the full preferences document for this user. */
  put(preferences: UserPreferences): Promise<UserPreferences>;
}
