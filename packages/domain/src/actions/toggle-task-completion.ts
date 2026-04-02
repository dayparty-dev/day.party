import type { Task } from '@dayparty/core';
import type { TaskRepository } from '../interfaces/task-repository';
import type { UpdateTaskInput } from './update-task';

/**
 * Toggles completion by delegating to `updateTask` so lifecycle rules (status sync,
 * tag validation, **bounty → ledger** on first complete, etc.) stay in one place.
 */
export function makeToggleTaskCompletionAction(
  taskRepo: TaskRepository,
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>,
) {
  return async (id: string): Promise<Task> => {
    const task = await taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task "${id}" not found`);
    }

    const nextComplete = !task.isComplete;
    return updateTask(id, {
      isComplete: nextComplete,
      status: nextComplete ? 'done' : 'planned',
      deferredToDate: undefined,
    });
  };
}
