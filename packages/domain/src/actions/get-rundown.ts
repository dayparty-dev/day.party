import { DEFAULT_DAY_WINDOW, taskToRundownItem, type DayRundown } from '@dayparty/core';
import type { TaskRepository } from '../interfaces/task-repository';
import type { UserPreferencesRepository } from '../interfaces/user-preferences-repository';
import { computeDayFit } from '../day-fit';

export function makeGetRundownAction(taskRepo: TaskRepository, userPrefsRepo: UserPreferencesRepository) {
  return async (userId: string, date: string): Promise<DayRundown> => {
    const tasks = await taskRepo.findByUserAndDate(userId, date);
    const prefs = await userPrefsRepo.findByUserId(userId);
    const dayWindow = prefs?.dayWindow ?? DEFAULT_DAY_WINDOW;
    const dayFit = computeDayFit(tasks, dayWindow, { sizeToMinutes: prefs?.sizeToMinutes });

    const capacity = tasks.reduce((sum, t) => sum + t.size, 0);
    const completed = tasks.filter((t) => t.isComplete).length;
    return {
      date,
      userId,
      tasks: tasks.map(taskToRundownItem),
      capacity,
      completed,
      dayFit,
      dayWindow,
    };
  };
}
