import type { DayRundown, Task } from '@dayparty/core';
import { ERROR_CODES } from '@dayparty/core';
import {
  createApiError,
  createTaskSchema,
  fromZodError,
  reorderTasksSchema,
  updateTaskSchema,
} from '@dayparty/validation';
import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth-middleware.js';
import type { ApiEnv, ApiVariables } from '../types.js';

function taskPublic(task: Task): Omit<Task, 'userId'> {
  const { userId: _u, ...rest } = task;
  return rest;
}

function rundownResponse(r: DayRundown) {
  const { userId: _u, tasks, ...rest } = r;
  return { ...rest, tasks: tasks.map(taskPublic) };
}

export function createTaskRoutes(env: ApiEnv) {
  const tasks = new Hono<{ Variables: ApiVariables }>();
  const requireAuth = createAuthMiddleware(env);
  tasks.use('/*', requireAuth);

  tasks.get('/', async (c) => {
    const date = c.req.query('date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return c.json(
        createApiError(ERROR_CODES.VALIDATION_ERROR, 'Invalid date', {
          date: ['Required ISO date YYYY-MM-DD'],
        }),
        422,
      );
    }
    const user = c.get('user');
    const rundown = await env.getRundown(user.id, date);
    return c.json(rundownResponse(rundown));
  });

  tasks.post('/', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const user = c.get('user');
    try {
      const task = await env.createTask({ userId: user.id, ...parsed.data });
      return c.json(taskPublic(task), 201);
    } catch (e) {
      if (e instanceof Error && e.message.includes('Tag')) {
        return c.json(createApiError(ERROR_CODES.VALIDATION_ERROR, e.message, { tagKey: [e.message] }), 422);
      }
      throw e;
    }
  });

  tasks.patch('/reorder', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = reorderTasksSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const user = c.get('user');
    try {
      const rundown = await env.reorderTasks(user.id, parsed.data.date, parsed.data.taskIds);
      return c.json(rundownResponse(rundown));
    } catch (e) {
      if (e instanceof Error && e.message.includes('does not belong')) {
        return c.json(createApiError(ERROR_CODES.VALIDATION_ERROR, e.message, { taskIds: [e.message] }), 422);
      }
      throw e;
    }
  });

  tasks.patch('/:id', async (c) => {
    const id = c.req.param('id');
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const user = c.get('user');
    const existing = await env.taskRepo.findById(id);
    if (!existing || existing.userId !== user.id) {
      return c.json(createApiError(ERROR_CODES.NOT_FOUND, 'Task not found'), 404);
    }
    try {
      const task = await env.updateTask(id, parsed.data);
      return c.json(taskPublic(task));
    } catch (e) {
      if (e instanceof Error && e.message.includes('not found')) {
        return c.json(createApiError(ERROR_CODES.NOT_FOUND, e.message), 404);
      }
      if (e instanceof Error && e.message.includes('Tag')) {
        return c.json(createApiError(ERROR_CODES.VALIDATION_ERROR, e.message, { tagKey: [e.message] }), 422);
      }
      throw e;
    }
  });

  tasks.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const existing = await env.taskRepo.findById(id);
    if (!existing || existing.userId !== user.id) {
      return c.json(createApiError(ERROR_CODES.NOT_FOUND, 'Task not found'), 404);
    }
    try {
      await env.deleteTask(id);
      return c.json({ message: 'Deleted' });
    } catch (e) {
      if (e instanceof Error && e.message.includes('not found')) {
        return c.json(createApiError(ERROR_CODES.NOT_FOUND, e.message), 404);
      }
      throw e;
    }
  });

  return tasks;
}
