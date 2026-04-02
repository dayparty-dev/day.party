import { DEFAULT_DAY_WINDOW } from '@dayparty/core';
import type { TaskRepository } from './interfaces/task-repository';
import type { UserPreferencesRepository } from './interfaces/user-preferences-repository';
import { computeDayFit } from './day-fit';

/** Minimum “open capacity” minutes to surface a day in move-to-day hints (research.md §5). */
export const SUGGESTION_MIN_HEADROOM_MINUTES = 30;

/** Maximum inclusive span between fromDate and toDate (abuse guard). */
export const SUGGESTIONS_MAX_RANGE_DAYS = 14;

export type DayCapacityHint = {
  date: string;
  remainingMinutes: number;
  availableMinutes: number;
  plannedMinutes: number;
};

export type DaySuggestionsResult = { hints: DayCapacityHint[] };

function parseIsoDateParts(iso: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Calendar arithmetic on `YYYY-MM-DD` in UTC to avoid DST edge cases. */
export function addCalendarDays(isoDate: string, deltaDays: number): string {
  const [y, mo, d] = parseIsoDateParts(isoDate);
  const ms = Date.UTC(y, mo - 1, d) + deltaDays * 86_400_000;
  const x = new Date(ms);
  const yy = x.getUTCFullYear();
  const mm = String(x.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(x.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function compareIsoDates(a: string, b: string): number {
  return new Date(`${a}T12:00:00.000Z`).getTime() - new Date(`${b}T12:00:00.000Z`).getTime();
}

function inclusiveDaySpan(fromDate: string, toDate: string): number {
  const fromMs = new Date(`${fromDate}T12:00:00.000Z`).getTime();
  const toMs = new Date(`${toDate}T12:00:00.000Z`).getTime();
  return Math.round((toMs - fromMs) / 86_400_000) + 1;
}

export function makeSuggestDayCapacitiesAction(taskRepo: TaskRepository, userPrefsRepo: UserPreferencesRepository) {
  return async (userId: string, fromDate: string, toDate: string): Promise<DaySuggestionsResult> => {
    if (compareIsoDates(fromDate, toDate) > 0) {
      throw new Error('fromDate must be on or before toDate');
    }

    const span = inclusiveDaySpan(fromDate, toDate);
    if (span > SUGGESTIONS_MAX_RANGE_DAYS) {
      throw new Error(`Date range must not exceed ${SUGGESTIONS_MAX_RANGE_DAYS} days`);
    }

    const prefs = await userPrefsRepo.findByUserId(userId);
    const dayWindow = prefs?.dayWindow ?? DEFAULT_DAY_WINDOW;
    const sizeToMinutes = prefs?.sizeToMinutes;

    const hints: DayCapacityHint[] = [];
    for (let cursor = fromDate; compareIsoDates(cursor, toDate) <= 0; cursor = addCalendarDays(cursor, 1)) {
      const tasks = await taskRepo.findByUserAndDate(userId, cursor);
      const fit = computeDayFit(tasks, dayWindow, { sizeToMinutes });
      const remaining = fit.availableMinutes - fit.plannedMinutes;
      if (remaining >= SUGGESTION_MIN_HEADROOM_MINUTES) {
        hints.push({
          date: cursor,
          remainingMinutes: remaining,
          availableMinutes: fit.availableMinutes,
          plannedMinutes: fit.plannedMinutes,
        });
      }
    }

    return { hints };
  };
}
