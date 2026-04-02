import type { Task } from '@dayparty/core';
import { describe, expect, it } from 'vitest';
import type { TaskRepository } from '../interfaces/task-repository';
import { makeApplyTaskTriageAction } from './triage-task';

const iso = '2026-04-02T12:00:00.000Z';

function task(partial: Partial<Task> & Pick<Task, 'id' | 'userId'>): Task {
  return {
    title: 't',
    size: 2,
    status: 'planned',
    isComplete: false,
    scheduledDate: '2026-04-02',
    position: 0,
    createdAt: iso,
    updatedAt: iso,
    ...partial,
  };
}

describe('makeApplyTaskTriageAction', () => {
  it('defer_to_date moves the task to the target day at the next position', async () => {
    const tasks: Task[] = [
      task({ id: 'x', userId: 'u1', scheduledDate: '2026-04-02', position: 0 }),
      task({ id: 'y', userId: 'u1', scheduledDate: '2026-04-03', position: 0 }),
    ];
    const repo: TaskRepository = {
      findByUserAndDate: async (uid, date) => tasks.filter((t) => t.userId === uid && t.scheduledDate === date),
      findById: async (id) => tasks.find((t) => t.id === id) ?? null,
      create: async () => {
        throw new Error('unused');
      },
      update: async (id, fields) => {
        const i = tasks.findIndex((t) => t.id === id);
        if (i < 0) return null;
        tasks[i] = { ...tasks[i]!, ...fields, updatedAt: iso };
        return tasks[i]!;
      },
      delete: async () => {},
      reorder: async () => {},
      nullifyTagKeyForUser: async () => {},
    };

    const action = makeApplyTaskTriageAction(repo);
    const updated = await action('u1', 'x', { action: 'defer_to_date', targetDate: '2026-04-03' });

    expect(updated.scheduledDate).toBe('2026-04-03');
    expect(updated.position).toBe(1);
    expect(updated.status).toBe('planned');
  });

  it('rejects defer_to_date when target equals scheduledDate', async () => {
    const tasks: Task[] = [task({ id: 'x', userId: 'u1', scheduledDate: '2026-04-02', position: 0 })];
    const repo: TaskRepository = {
      findByUserAndDate: async () => [],
      findById: async (id) => tasks.find((t) => t.id === id) ?? null,
      create: async () => {
        throw new Error('unused');
      },
      update: async () => null,
      delete: async () => {},
      reorder: async () => {},
      nullifyTagKeyForUser: async () => {},
    };
    const action = makeApplyTaskTriageAction(repo);
    await expect(action('u1', 'x', { action: 'defer_to_date', targetDate: '2026-04-02' })).rejects.toThrow(
      /must differ/,
    );
  });
});
