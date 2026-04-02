import {
  DEFAULT_DAY_WINDOW,
  DEFAULT_VISUAL_PRESET,
  type ColorScheme,
  type DayWindow,
  type TaskSize,
  type UserLocale,
  type UserPreferences,
  type VisualPreset,
} from '@dayparty/core';
import type { PlanHistoryRepository } from '../interfaces/plan-history-repository';
import type { UserPreferencesRepository } from '../interfaces/user-preferences-repository';

function defaultPreferences(userId: string): UserPreferences {
  return {
    userId,
    dayWindow: DEFAULT_DAY_WINDOW,
    visualPreset: DEFAULT_VISUAL_PRESET,
    updatedAt: new Date().toISOString(),
  };
}

/** Partial update (validated at API with Zod). */
export type UserPreferencesPatch = {
  dayWindow?: DayWindow;
  visualPreset?: VisualPreset;
  sizeToMinutes?: Partial<Record<TaskSize, number>>;
  locale?: UserLocale;
  colorScheme?: ColorScheme;
};

export function makeGetUserPreferencesAction(userPrefsRepo: UserPreferencesRepository) {
  return async (userId: string): Promise<UserPreferences> => {
    const existing = await userPrefsRepo.findByUserId(userId);
    return existing ?? defaultPreferences(userId);
  };
}

export function makePatchUserPreferencesAction(
  userPrefsRepo: UserPreferencesRepository,
  historyRepo: PlanHistoryRepository,
) {
  return async (userId: string, patch: UserPreferencesPatch): Promise<UserPreferences> => {
    const existing = await userPrefsRepo.findByUserId(userId);
    const base = existing ?? defaultPreferences(userId);
    const next: UserPreferences = {
      userId,
      dayWindow: patch.dayWindow ?? base.dayWindow,
      visualPreset: patch.visualPreset ?? base.visualPreset,
      sizeToMinutes:
        patch.sizeToMinutes !== undefined ? { ...base.sizeToMinutes, ...patch.sizeToMinutes } : base.sizeToMinutes,
      locale: patch.locale !== undefined ? patch.locale : base.locale,
      colorScheme: patch.colorScheme !== undefined ? patch.colorScheme : base.colorScheme,
      updatedAt: new Date().toISOString(),
    };
    const saved = await userPrefsRepo.put(next);
    const keys = Object.keys(patch) as (keyof UserPreferencesPatch)[];
    if (keys.length > 0) {
      await historyRepo.append({
        userId,
        type: 'preferences.updated',
        entityId: userId,
        payload: { keys },
      });
    }
    return saved;
  };
}
