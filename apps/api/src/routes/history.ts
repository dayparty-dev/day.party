import type { PlanHistoryEvent } from '@dayparty/core';
import { fromZodError, historyQuerySchema } from '@dayparty/validation';
import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import type { ApiEnv, ApiVariables } from '../types';

function historyEventPublic(e: PlanHistoryEvent): Omit<PlanHistoryEvent, 'userId'> {
  const { userId: _u, ...rest } = e;
  return rest;
}

export function createHistoryRoutes(env: ApiEnv) {
  const history = new Hono<{ Variables: ApiVariables }>();
  const requireAuth = createAuthMiddleware(env);
  history.use('/*', requireAuth);

  history.get('/', async (c) => {
    const raw = {
      limit: c.req.query('limit') ?? undefined,
      cursor: c.req.query('cursor') ?? undefined,
      order: c.req.query('order') ?? undefined,
    };
    const parsed = historyQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const user = c.get('user');
    const page = await env.getHistoryPage(user.id, {
      limit: parsed.data.limit,
      ...(parsed.data.cursor ? { cursor: parsed.data.cursor } : {}),
      order: parsed.data.order,
    });
    return c.json({
      events: page.events.map(historyEventPublic),
      ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
    });
  });

  return history;
}
