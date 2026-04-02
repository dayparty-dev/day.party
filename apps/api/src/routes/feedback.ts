import { createFeedbackSchema, fromZodError } from '@dayparty/validation';
import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import type { ApiEnv, ApiVariables } from '../types';

export function createFeedbackRoutes(env: ApiEnv) {
  const r = new Hono<{ Variables: ApiVariables }>();
  r.use('/*', createAuthMiddleware(env));

  r.post('/', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = createFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const user = c.get('user');
    const userAgent = c.req.header('User-Agent') ?? undefined;
    const row = await env.submitFeedback({
      userId: user.id,
      message: parsed.data.message,
      category: parsed.data.category,
      userAgent,
    });
    return c.json({ id: row.id, createdAt: row.createdAt }, 201);
  });

  return r;
}
