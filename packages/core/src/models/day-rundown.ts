import type { DayWindow } from './user-preferences';
import type { TaskRundownItem } from './task-rundown';

/** Derived fit metadata for a day (contract P1); computed in domain (`computeDayFit`). */
export type DayFit = {
  availableMinutes: number;
  plannedMinutes: number;
  inRunwayTaskIds: string[];
  outsideRunwayTaskIds: string[];
  overflowUnresolved: boolean;
};

/** Placeholder until `computeDayFit` wires real values (T007/T008). */
export const EMPTY_DAY_FIT: DayFit = {
  availableMinutes: 0,
  plannedMinutes: 0,
  inRunwayTaskIds: [],
  outsideRunwayTaskIds: [],
  overflowUnresolved: false,
};

export interface DayRundown {
  date: string;
  userId: string;
  tasks: TaskRundownItem[];
  capacity: number;
  completed: number;
  dayFit: DayFit;
  /** Echoed from user preferences (or defaults) for clients. */
  dayWindow: DayWindow;
}
