import type { Task } from '@dayparty/core';
import type { TaskRepository } from '../interfaces/task-repository';

export function makeToggleTaskCompletionAction(taskRepo: TaskRepository) {
  return async (id: string): Promise<Task> => {
    const task = await taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task "${id}" not found`);
    }

    const updated = await taskRepo.update(id, { isComplete: !task.isComplete });
    if (!updated) {
      throw new Error(`Task "${id}" not found after update`);
    }

    return updated;
  };
}
