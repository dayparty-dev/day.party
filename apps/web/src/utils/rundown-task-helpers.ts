import type { DayRundownResponse, TaskRundownItemResponse } from '@dayparty/api-client';
import type { TaskRunwayPlacement } from '../components/TaskCard';

export function runwayPlacementForTask(
  task: TaskRundownItemResponse,
  dayFit: DayRundownResponse['dayFit'],
): TaskRunwayPlacement {
  if (task.isComplete) {
    return 'complete';
  }
  return dayFit.outsideRunwayTaskIds.includes(task.id) ? 'outside-runway' : 'in-runway';
}

export function showTriageForTask(task: TaskRundownItemResponse, dayFit: DayRundownResponse['dayFit']): boolean {
  if (task.isComplete) {
    return false;
  }
  if (task.status === 'skipped') {
    return true;
  }
  return dayFit.overflowUnresolved || dayFit.outsideRunwayTaskIds.includes(task.id);
}
