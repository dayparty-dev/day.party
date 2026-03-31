import type { TaskRepository } from '../interfaces/task-repository.js';

export function makeDeleteTaskAction(taskRepo: TaskRepository) {
  return async (id: string): Promise<void> => {
    const task = await taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task "${id}" not found`);
    }

    const { userId, scheduledDate } = task;
    await taskRepo.delete(id);

    const remaining = await taskRepo.findByUserAndDate(userId, scheduledDate);
    const sorted = [...remaining].sort((a, b) => a.position - b.position);
    const updates = sorted.map((t, index) => ({ id: t.id, position: index }));

    if (updates.length > 0) {
      await taskRepo.reorder(updates);
    }
  };
}
