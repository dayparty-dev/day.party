import { DEFAULT_DAY_WINDOW, type Task } from '@dayparty/core';
import { describe, expect, it } from 'vitest';
import type { TaskRepository } from '../interfaces/task-repository';
import type { UserPreferencesRepository } from '../interfaces/user-preferences-repository';
import { makeGetRundownAction } from './get-rundown';

const iso = '2026-04-02T12:00:00.000Z';

function createNoopUserPrefsRepo(): UserPreferencesRepository {
  return {
    findByUserId: async () => null,
    put: async () => {
      throw new Error('unused in test');
    },
  };
}

function createTaskRepoWithTasks(forDate: string, userId: string, initial: Task[]): TaskRepository {
  return {
    findByUserAndDate: async (uid, date) => (uid === userId && date === forDate ? [...initial] : []),
    findById: async () => null,
    create: async () => {
      throw new Error('unused in test');
    },
    update: async () => null,
    delete: async () => {},
    reorder: async () => {},
    nullifyTagKeyForUser: async () => {},
  };
}

describe('makeGetRundownAction', () => {
  it('returns capacity as sum of task sizes and completed count', async () => {
    const date = '2026-04-02';
    const userId = 'u1';
    const tasks: Task[] = [
      {
        id: 'a',
        userId,
        title: 'One',
        size: 2,
        isComplete: true,
        scheduledDate: date,
        position: 0,
        createdAt: iso,
        updatedAt: iso,
      },
      {
        id: 'b',
        userId,
        title: 'Two',
        size: 3,
        isComplete: false,
        scheduledDate: date,
        position: 1,
        createdAt: iso,
        updatedAt: iso,
      },
    ];
    const taskRepo = createTaskRepoWithTasks(date, userId, tasks);
    const getRundown = makeGetRundownAction(taskRepo, createNoopUserPrefsRepo());

    const rundown = await getRundown(userId, date);

    expect(rundown.capacity).toBe(5);
    expect(rundown.completed).toBe(1);
    expect(rundown.tasks).toHaveLength(2);
    expect(rundown.dayWindow).toEqual(DEFAULT_DAY_WINDOW);
    expect(rundown.dayFit.availableMinutes).toBe(
      DEFAULT_DAY_WINDOW.endMinuteOfDay - DEFAULT_DAY_WINDOW.startMinuteOfDay,
    );
    expect(rundown.dayFit.plannedMinutes).toBe(40);
    expect(rundown.dayFit.inRunwayTaskIds).toEqual(['a', 'b']);
    expect(rundown.dayFit.outsideRunwayTaskIds).toEqual([]);
    expect(rundown.dayFit.overflowUnresolved).toBe(false);
  });
});
