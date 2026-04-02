import type { Tag, Task } from '@dayparty/core';
import { describe, expect, it } from 'vitest';
import type { PlanHistoryRepository } from '../interfaces/plan-history-repository';
import type { TagRepository } from '../interfaces/tag-repository';
import type { TaskRepository } from '../interfaces/task-repository';
import { makeCreateTaskAction } from './create-task';

const iso = '2026-04-02T12:00:00.000Z';

function createInMemoryTaskRepo(initial: Task[] = []): { repo: TaskRepository; tasks: Task[] } {
  const tasks = [...initial];
  let idSeq = 0;
  const repo: TaskRepository = {
    findByUserAndDate: async (userId, date) => tasks.filter((t) => t.userId === userId && t.scheduledDate === date),
    findById: async (id) => tasks.find((t) => t.id === id) ?? null,
    create: async (data) => {
      const task: Task = {
        ...data,
        id: `t-${++idSeq}`,
        createdAt: iso,
        updatedAt: iso,
      };
      tasks.push(task);
      return task;
    },
    update: async () => null,
    delete: async () => {},
    reorder: async () => {},
    nullifyTagKeyForUser: async () => {},
    applyTagDeletionPolicy: async () => 0,
  };
  return { repo, tasks };
}

const noopHistory: PlanHistoryRepository = {
  append: async (input) => ({
    id: 'h1',
    userId: input.userId,
    timestamp: iso,
    type: input.type,
    entityId: input.entityId,
    payload: input.payload,
  }),
  listByUserId: async () => ({ events: [] }),
};

function createInMemoryTagRepo(byKey: Map<string, Tag | null>): TagRepository {
  return {
    findByUser: async () => [],
    findByIdForUser: async () => null,
    findByKey: async (userId, key) => byKey.get(`${userId}:${key}`) ?? null,
    create: async () => {
      throw new Error('unused in test');
    },
    update: async () => null,
    delete: async () => {},
    seedDefaults: async () => {},
  };
}

describe('makeCreateTaskAction', () => {
  it('creates a task at position 0 when no tasks exist for that day', async () => {
    const { repo: taskRepo, tasks } = createInMemoryTaskRepo([]);
    const tagRepo = createInMemoryTagRepo(new Map());
    const action = makeCreateTaskAction(taskRepo, tagRepo, noopHistory);

    const task = await action({
      userId: 'u1',
      title: 'Morning block',
      size: 3,
      scheduledDate: '2026-04-02',
    });

    expect(task.position).toBe(0);
    expect(task.status).toBe('planned');
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.title).toBe('Morning block');
  });

  it('rejects when tagKey is set and the tag does not exist', async () => {
    const { repo: taskRepo } = createInMemoryTaskRepo([]);
    const tagRepo = createInMemoryTagRepo(new Map());
    const action = makeCreateTaskAction(taskRepo, tagRepo, noopHistory);

    await expect(
      action({
        userId: 'u1',
        title: 'Tagged',
        size: 2,
        tagKey: 'missing',
        scheduledDate: '2026-04-02',
      }),
    ).rejects.toThrow(/Tag with key "missing" not found/);
  });
});
