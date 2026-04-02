import type { TaskRundownItemResponse } from '@dayparty/api-client';

/** Incomplete tasks for the day, runway order. */
export function openSortedTasks(tasks: TaskRundownItemResponse[]): TaskRundownItemResponse[] {
  return tasks.filter((t) => !t.isComplete).sort((a, b) => a.position - b.position);
}

/** Prefer in-progress, else first open item by runway order. */
export function pickFocusTask(tasks: TaskRundownItemResponse[]): TaskRundownItemResponse | null {
  const open = openSortedTasks(tasks);
  const inProgress = open.find((t) => t.status === 'in_progress');
  return inProgress ?? open[0] ?? null;
}

/** Next open task after the current focus card in runway order (same day). */
export function nextTaskAfterFocus(
  focus: TaskRundownItemResponse | null,
  openSorted: TaskRundownItemResponse[],
): TaskRundownItemResponse | null {
  if (!focus) {
    return null;
  }
  const i = openSorted.findIndex((t) => t.id === focus.id);
  if (i < 0) {
    return null;
  }
  return openSorted[i + 1] ?? null;
}
