import type { Task } from '@dayparty/core';
import { mergeFocusForStatusTransition } from '../focus-session';
import type { PlanHistoryRepository } from '../interfaces/plan-history-repository';
import type { TaskRepository } from '../interfaces/task-repository';

export type TaskTriageInput =
  | { action: 'defer_to_date'; targetDate: string }
  | { action: 'demote' }
  | { action: 'mark_skipped' }
  | { action: 'clear_skipped' };

export function makeApplyTaskTriageAction(taskRepo: TaskRepository, historyRepo: PlanHistoryRepository) {
  return async (userId: string, taskId: string, input: TaskTriageInput): Promise<Task> => {
    const task = await taskRepo.findById(taskId);
    if (!task || task.userId !== userId) {
      throw new Error(`Task "${taskId}" not found`);
    }

    switch (input.action) {
      case 'defer_to_date': {
        if (input.targetDate === task.scheduledDate) {
          throw new Error('targetDate must differ from the task scheduledDate');
        }
        const targetTasks = await taskRepo.findByUserAndDate(userId, input.targetDate);
        const focus = mergeFocusForStatusTransition(task, 'planned');
        const updated = await taskRepo.update(taskId, {
          scheduledDate: input.targetDate,
          position: targetTasks.length,
          status: 'planned',
          isComplete: false,
          deferredToDate: undefined,
          ...focus,
        });
        if (!updated) {
          throw new Error(`Task "${taskId}" not found after update`);
        }
        await historyRepo.append({
          userId,
          type: 'task.triage',
          entityId: taskId,
          payload: { action: 'defer_to_date', fromDate: task.scheduledDate, targetDate: input.targetDate },
        });
        return updated;
      }
      case 'demote': {
        const updated = await taskRepo.update(taskId, { essentiality: 'optional' });
        if (!updated) {
          throw new Error(`Task "${taskId}" not found after update`);
        }
        await historyRepo.append({
          userId,
          type: 'task.triage',
          entityId: taskId,
          payload: { action: 'demote' },
        });
        return updated;
      }
      case 'mark_skipped': {
        const focus = mergeFocusForStatusTransition(task, 'skipped');
        const updated = await taskRepo.update(taskId, {
          status: 'skipped',
          isComplete: false,
          deferredToDate: undefined,
          ...focus,
        });
        if (!updated) {
          throw new Error(`Task "${taskId}" not found after update`);
        }
        await historyRepo.append({
          userId,
          type: 'task.triage',
          entityId: taskId,
          payload: { action: 'mark_skipped' },
        });
        return updated;
      }
      case 'clear_skipped': {
        if (task.status !== 'skipped') {
          throw new Error('Task is not skipped');
        }
        const focus = mergeFocusForStatusTransition(task, 'planned');
        const updated = await taskRepo.update(taskId, { status: 'planned', ...focus });
        if (!updated) {
          throw new Error(`Task "${taskId}" not found after update`);
        }
        await historyRepo.append({
          userId,
          type: 'task.triage',
          entityId: taskId,
          payload: { action: 'clear_skipped' },
        });
        return updated;
      }
    }
  };
}
