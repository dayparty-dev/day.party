import type { Task } from './models/task';

/** Elapsed focused time in milliseconds (cumulative + open in_progress session). */
export function taskFocusedElapsedMs(
  task: Pick<Task, 'focusedSecondsTotal' | 'focusSessionStartedAt' | 'status'>,
  nowMs: number = Date.now(),
): number {
  const base = (task.focusedSecondsTotal ?? 0) * 1000;
  if (task.status === 'in_progress' && task.focusSessionStartedAt) {
    const start = Date.parse(task.focusSessionStartedAt);
    if (Number.isFinite(start)) {
      return base + Math.max(0, nowMs - start);
    }
  }
  return base;
}
