import type { Task, TaskStatus } from '@dayparty/core';

/**
 * Server-side focus clock: when status leaves `in_progress`, accumulate the open session
 * into `focusedSecondsTotal` and clear `focusSessionStartedAt`. When status enters
 * `in_progress`, set `focusSessionStartedAt` to now.
 */
export function mergeFocusForStatusTransition(
  task: Task,
  nextStatus: TaskStatus,
  nowMs: number = Date.now(),
): Partial<Pick<Task, 'focusedSecondsTotal' | 'focusSessionStartedAt'>> {
  const nowIso = new Date(nowMs).toISOString();
  let total = task.focusedSecondsTotal ?? 0;
  const hadActiveSession = task.status === 'in_progress' && task.focusSessionStartedAt != null;

  if (hadActiveSession && nextStatus !== 'in_progress') {
    const start = Date.parse(task.focusSessionStartedAt!);
    if (Number.isFinite(start) && nowMs >= start) {
      total += Math.floor((nowMs - start) / 1000);
    }
  }

  if (nextStatus === 'in_progress') {
    if (task.status !== 'in_progress') {
      return { focusSessionStartedAt: nowIso };
    }
    return {};
  }

  return { focusedSecondsTotal: total, focusSessionStartedAt: undefined };
}
