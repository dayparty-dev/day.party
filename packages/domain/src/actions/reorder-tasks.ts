import { DEFAULT_DAY_WINDOW, taskToRundownItem, type DayRundown } from '@dayparty/core';
import type { TaskRepository } from '../interfaces/task-repository';
import type { UserPreferencesRepository } from '../interfaces/user-preferences-repository';
import { computeDayFit } from '../day-fit';

export function makeReorderTasksAction(taskRepo: TaskRepository, userPrefsRepo: UserPreferencesRepository) {
  return async (userId: string, date: string, taskIds: string[]): Promise<DayRundown> => {
    const tasks = await taskRepo.findByUserAndDate(userId, date);
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    for (const id of taskIds) {
      if (!taskMap.has(id)) {
        throw new Error(`Task "${id}" does not belong to user "${userId}" on date "${date}"`);
      }
    }

    const updates = taskIds.map((id, index) => ({ id, position: index }));
    await taskRepo.reorder(updates);

    const reorderedTasks = taskIds.map((id, index) => ({
      ...taskMap.get(id)!,
      position: index,
    }));

    const prefs = await userPrefsRepo.findByUserId(userId);
    const dayWindow = prefs?.dayWindow ?? DEFAULT_DAY_WINDOW;
    const dayFit = computeDayFit(reorderedTasks, dayWindow, { sizeToMinutes: prefs?.sizeToMinutes });

    const capacity = reorderedTasks.reduce((sum, t) => sum + t.size, 0);
    const completed = reorderedTasks.filter((t) => t.isComplete).length;
    return {
      date,
      userId,
      tasks: reorderedTasks.map(taskToRundownItem),
      capacity,
      completed,
      dayFit,
      dayWindow,
    };
  };
}
