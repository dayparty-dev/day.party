import type { PlanHistoryRepository } from '../interfaces/plan-history-repository';
import type { TaskRepository } from '../interfaces/task-repository';

export function makeDeleteTaskAction(taskRepo: TaskRepository, historyRepo: PlanHistoryRepository) {
  return async (id: string): Promise<void> => {
    const task = await taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task "${id}" not found`);
    }

    const { userId, scheduledDate } = task;
    await historyRepo.append({
      userId: task.userId,
      type: 'task.deleted',
      entityId: task.id,
      payload: { title: task.title, scheduledDate: task.scheduledDate },
    });

    await taskRepo.delete(id);

    const remaining = await taskRepo.findByUserAndDate(userId, scheduledDate);
    const sorted = [...remaining].sort((a, b) => a.position - b.position);
    const updates = sorted.map((t, index) => ({ id: t.id, position: index }));

    if (updates.length > 0) {
      await taskRepo.reorder(updates);
    }
  };
}
