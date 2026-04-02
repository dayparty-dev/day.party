import type { TaskSize } from '../constants/index';

/** UI theme preset (FR-009). */
export type VisualPreset = 'default' | 'calm' | 'playful' | 'highContrast';

/** Default preset when no preference is stored (API GET synthesis + PATCH merge base). */
export const DEFAULT_VISUAL_PRESET: VisualPreset = 'default';

/** User-defined daily planning window (FR-002). */
export type DayWindow = {
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  crossesMidnight: boolean;
};

/** Default planning window when prefs are missing (09:00–17:00, same calendar day). */
export const DEFAULT_DAY_WINDOW: DayWindow = {
  startMinuteOfDay: 9 * 60,
  endMinuteOfDay: 17 * 60,
  crossesMidnight: false,
};

/** In-app locale (FR-009). Omitted in storage until the user patches preferences. */
export type UserLocale = 'en' | 'es';

/** Global light/dark vs OS (FR-010). Omitted in storage until patched. */
export type ColorScheme = 'system' | 'light' | 'dark';

export const DEFAULT_LOCALE: UserLocale = 'en';

export const DEFAULT_COLOR_SCHEME: ColorScheme = 'system';

/** Persisted user planning and presentation preferences (1:1 with user in v1). */
export type UserPreferences = {
  userId: string;
  dayWindow: DayWindow;
  visualPreset: VisualPreset;
  /** Optional override for size (1–5) to estimated minutes; platform defaults when absent. */
  sizeToMinutes?: Partial<Record<TaskSize, number>>;
  /** Present after first PATCH that sets locale; API GET synthesizes {@link DEFAULT_LOCALE} until then. */
  locale?: UserLocale;
  /** Present after first PATCH that sets scheme; API GET synthesizes {@link DEFAULT_COLOR_SCHEME} until then. */
  colorScheme?: ColorScheme;
  updatedAt: string;
};
