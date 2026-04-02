import type { Task } from '@dayparty/core';
import type { TaskRepository } from '../interfaces/task-repository';

export type TaskTriageInput =
  | { action: 'defer_to_date'; targetDate: string }
  | { action: 'demote' }
  | { action: 'mark_skipped' }
  | { action: 'clear_skipped' };

export function makeApplyTaskTriageAction(taskRepo: TaskRepository) {
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
        const updated = await taskRepo.update(taskId, {
          scheduledDate: input.targetDate,
          position: targetTasks.length,
          status: 'planned',
          isComplete: false,
          deferredToDate: undefined,
        });
        if (!updated) {
          throw new Error(`Task "${taskId}" not found after update`);
        }
        return updated;
      }
      case 'demote': {
        const updated = await taskRepo.update(taskId, { essentiality: 'optional' });
        if (!updated) {
          throw new Error(`Task "${taskId}" not found after update`);
        }
        return updated;
      }
      case 'mark_skipped': {
        const updated = await taskRepo.update(taskId, {
          status: 'skipped',
          isComplete: false,
          deferredToDate: undefined,
        });
        if (!updated) {
          throw new Error(`Task "${taskId}" not found after update`);
        }
        return updated;
      }
      case 'clear_skipped': {
        if (task.status !== 'skipped') {
          throw new Error('Task is not skipped');
        }
        const updated = await taskRepo.update(taskId, { status: 'planned' });
        if (!updated) {
          throw new Error(`Task "${taskId}" not found after update`);
        }
        return updated;
      }
    }
  };
}
