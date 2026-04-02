import type { TaskSize } from '../constants/index';

/** UI theme preset (FR-009). */
export type VisualPreset = 'default' | 'calm' | 'playful' | 'highContrast';

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

/** Persisted user planning and presentation preferences (1:1 with user in v1). */
export type UserPreferences = {
  userId: string;
  dayWindow: DayWindow;
  visualPreset: VisualPreset;
  /** Optional override for size (1–5) to estimated minutes; platform defaults when absent. */
  sizeToMinutes?: Partial<Record<TaskSize, number>>;
  updatedAt: string;
};
