import { ERROR_CODES } from '@dayparty/core';
import { createApiError } from '@dayparty/validation';
import { createMiddleware } from 'hono/factory';
import type { ApiEnv, ApiVariables } from '../types.js';

export function createAuthMiddleware(env: ApiEnv) {
  return createMiddleware<{ Variables: ApiVariables }>(async (c, next) => {
    const header = c.req.header('Authorization');
    const prefix = 'Bearer ';
    if (!header?.startsWith(prefix)) {
      return c.json(createApiError(ERROR_CODES.UNAUTHORIZED, 'Missing bearer token'), 401);
    }
    const token = header.slice(prefix.length).trim();
    const session = await env.sessionRepo.findByToken(token);
    if (!session) {
      return c.json(createApiError(ERROR_CODES.UNAUTHORIZED, 'Invalid or expired session'), 401);
    }
    if (session.expiresAt < new Date().toISOString()) {
      await env.sessionRepo.deleteByToken(token);
      return c.json(createApiError(ERROR_CODES.UNAUTHORIZED, 'Session expired'), 401);
    }
    const user = await env.userRepo.findById(session.userId);
    if (!user) {
      return c.json(createApiError(ERROR_CODES.UNAUTHORIZED, 'User not found'), 401);
    }
    c.set('user', user);
    await next();
  });
}
