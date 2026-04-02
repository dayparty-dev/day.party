import type { UserPreferences } from '@dayparty/core';
import { ERROR_CODES } from '@dayparty/core';
import { createApiError, fromZodError, patchUserPreferencesSchema } from '@dayparty/validation';
import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import type { ApiEnv, ApiVariables } from '../types';

function prefsPublic(p: UserPreferences): Omit<UserPreferences, 'userId'> {
  const { userId: _u, ...rest } = p;
  return rest;
}

export function createPreferenceRoutes(env: ApiEnv) {
  const prefs = new Hono<{ Variables: ApiVariables }>();
  const requireAuth = createAuthMiddleware(env);
  prefs.use('/*', requireAuth);

  prefs.get('/', async (c) => {
    const user = c.get('user');
    const doc = await env.getUserPreferences(user.id);
    return c.json(prefsPublic(doc));
  });

  prefs.patch('/', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = patchUserPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    if (Object.keys(parsed.data).length === 0) {
      return c.json(
        createApiError(ERROR_CODES.VALIDATION_ERROR, 'At least one preference field is required', {
          body: ['Provide dayWindow, visualPreset, and/or sizeToMinutes'],
        }),
        422,
      );
    }
    const user = c.get('user');
    const doc = await env.patchUserPreferences(user.id, parsed.data);
    return c.json(prefsPublic(doc));
  });

  return prefs;
}
