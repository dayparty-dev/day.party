import { ERROR_CODES } from '@dayparty/core';
import { adminPatchTaskSchema, createApiError, fromZodError } from '@dayparty/validation';
import { Hono } from 'hono';
import { createRequireAdmin } from '../middleware/admin-middleware';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import type { ApiEnv, ApiVariables } from '../types';
import { recordAdminAudit } from './admin/audit-helper';

export function createAdminRoutes(env: ApiEnv) {
  const admin = new Hono<{ Variables: ApiVariables }>();
  admin.use('/*', createAuthMiddleware(env));
  admin.use('/*', createRequireAdmin());

  admin.get('/users', async (c) => {
    const q = (c.req.query('q') ?? '').trim();
    if (q.length < 2) {
      return c.json({ items: [] as { id: string; email: string; displayName?: string; role: string }[] });
    }
    const users = await env.userRepo.searchByEmailSubstring(q, 50);
    await recordAdminAudit(env.adminAuditRepo, c.get('user').id, {
      action: 'user.list',
      targetType: 'user',
      summary: `Searched users by email substring`,
      metadata: { queryLength: q.length },
    });
    return c.json({
      items: users.map((u) => ({ id: u.id, email: u.email, displayName: u.displayName, role: u.role })),
    });
  });

  admin.get('/users/:id', async (c) => {
    const id = c.req.param('id');
    const user = await env.userRepo.findById(id);
    if (!user) {
      return c.json(createApiError(ERROR_CODES.NOT_FOUND, 'User not found'), 404);
    }
    await recordAdminAudit(env.adminAuditRepo, c.get('user').id, {
      action: 'user.view',
      targetType: 'user',
      targetId: id,
      summary: `Viewed user ${user.email}`,
    });
    return c.json({ id: user.id, email: user.email, displayName: user.displayName, role: user.role });
  });

  admin.get('/tasks', async (c) => {
    const userId = c.req.query('userId');
    const date = c.req.query('date');
    if (!userId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return c.json(
        createApiError(ERROR_CODES.VALIDATION_ERROR, 'userId and date (YYYY-MM-DD) are required', {
          query: ['userId and date required'],
        }),
        422,
      );
    }
    const tasks = await env.taskRepo.findByUserAndDate(userId, date);
    await recordAdminAudit(env.adminAuditRepo, c.get('user').id, {
      action: 'task.list',
      targetType: 'user',
      targetId: userId,
      summary: `Listed tasks for user on ${date}`,
      metadata: { date, count: tasks.length },
    });
    return c.json({
      items: tasks.map((t) => {
        const { userId: _u, ...rest } = t;
        return rest;
      }),
    });
  });

  admin.patch('/tasks/:id', async (c) => {
    const id = c.req.param('id');
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = adminPatchTaskSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    if (Object.keys(parsed.data).length === 0) {
      return c.json(createApiError(ERROR_CODES.VALIDATION_ERROR, 'Empty patch', { body: ['At least one field'] }), 422);
    }
    const existing = await env.taskRepo.findById(id);
    if (!existing) {
      return c.json(createApiError(ERROR_CODES.NOT_FOUND, 'Task not found'), 404);
    }
    try {
      const updated = await env.updateTask(id, parsed.data);
      await recordAdminAudit(env.adminAuditRepo, c.get('user').id, {
        action: 'task.patch',
        targetType: 'task',
        targetId: id,
        summary: `Admin patched task`,
        metadata: { keys: Object.keys(parsed.data), ownerUserId: existing.userId },
      });
      const { userId: _u, ...rest } = updated;
      return c.json(rest);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('not found') || msg.includes('Tag')) {
        return c.json(createApiError(ERROR_CODES.VALIDATION_ERROR, msg, { task: [msg] }), 422);
      }
      throw e;
    }
  });

  admin.get('/audit', async (c) => {
    const limitRaw = c.req.query('limit');
    const parsedLimit = limitRaw ? Number(limitRaw) : 20;
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 20;
    const cursor = c.req.query('cursor') ?? undefined;
    const res = await env.adminAuditRepo.listDescending(limit, cursor ?? null);
    return c.json({
      items: res.items.map((row) => ({
        id: row.id,
        actorUserId: row.actorUserId,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        summary: row.summary,
        createdAt: row.createdAt,
      })),
      nextCursor: res.nextCursor,
    });
  });

  admin.get('/feedback', async (c) => {
    const limitRaw = c.req.query('limit');
    const parsedLimit = limitRaw ? Number(limitRaw) : 20;
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 20;
    const cursor = c.req.query('cursor') ?? undefined;
    const res = await env.feedbackRepo.listForAdmin(limit, cursor ?? null);
    return c.json({
      items: res.items.map((x) => ({
        id: x.id,
        userId: x.userId,
        message: x.message,
        category: x.category,
        createdAt: x.createdAt,
      })),
      nextCursor: res.nextCursor,
    });
  });

  return admin;
}
