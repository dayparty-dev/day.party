import { DEFAULT_SIZE_TO_MINUTES, type DayFit, type DayWindow, type Task, type TaskSize } from '@dayparty/core';

/** Minutes available in the user's `dayWindow` (research.md §3). */
export function windowAvailableMinutes(dayWindow: DayWindow): number {
  const { startMinuteOfDay: start, endMinuteOfDay: end, crossesMidnight } = dayWindow;
  if (!crossesMidnight) {
    return Math.max(0, end - start);
  }
  return Math.max(0, 1440 - start + end);
}

function effectiveTaskMinutes(task: Task, sizeToMinutes?: Partial<Record<TaskSize, number>>): number {
  if (task.estimatedMinutes != null && Number.isFinite(task.estimatedMinutes)) {
    return Math.max(0, task.estimatedMinutes);
  }
  const merged = { ...DEFAULT_SIZE_TO_MINUTES, ...sizeToMinutes };
  return Math.max(0, merged[task.size]);
}

/**
 * Greedy pack in list order (research.md §4). Completed tasks do not consume runway
 * minutes; incomplete tasks beyond `availableMinutes` are outside the runway.
 * `overflowUnresolved` is true if any **essential** incomplete task is outside.
 */
export function computeDayFit(
  orderedTasks: Task[],
  dayWindow: DayWindow,
  options?: { sizeToMinutes?: Partial<Record<TaskSize, number>> },
): DayFit {
  const availableMinutes = windowAvailableMinutes(dayWindow);
  const sizeToMinutes = options?.sizeToMinutes;

  let plannedMinutes = 0;
  for (const task of orderedTasks) {
    if (!task.isComplete) {
      plannedMinutes += effectiveTaskMinutes(task, sizeToMinutes);
    }
  }

  const inRunwayTaskIds: string[] = [];
  const outsideRunwayTaskIds: string[] = [];
  let usedMinutes = 0;
  let overflowUnresolved = false;

  for (const task of orderedTasks) {
    if (task.isComplete) {
      inRunwayTaskIds.push(task.id);
      continue;
    }

    const est = effectiveTaskMinutes(task, sizeToMinutes);
    if (usedMinutes + est <= availableMinutes) {
      inRunwayTaskIds.push(task.id);
      usedMinutes += est;
    } else {
      outsideRunwayTaskIds.push(task.id);
      if (task.essentiality === 'essential') {
        overflowUnresolved = true;
      }
    }
  }

  return {
    availableMinutes,
    plannedMinutes,
    inRunwayTaskIds,
    outsideRunwayTaskIds,
    overflowUnresolved,
  };
}
