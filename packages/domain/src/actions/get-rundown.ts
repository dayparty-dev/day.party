import type { DayRundown } from '@dayparty/core';
import type { TaskRepository } from '../interfaces/task-repository';

export function makeGetRundownAction(taskRepo: TaskRepository) {
  return async (userId: string, date: string): Promise<DayRundown> => {
    const tasks = await taskRepo.findByUserAndDate(userId, date);
    const capacity = tasks.reduce((sum, t) => sum + t.size, 0);
    const completed = tasks.filter((t) => t.isComplete).length;
    return { date, userId, tasks, capacity, completed };
  };
}
