import { ERROR_CODES } from '@dayparty/core';
import { createApiError } from '@dayparty/validation';
import { createMiddleware } from 'hono/factory';
import type { ApiVariables } from '../types';

/**
 * 403 when `user.role !== 'admin'`. Mount **after** `createAuthMiddleware` so `user` is on context.
 */
export function createRequireAdmin() {
  return createMiddleware<{ Variables: ApiVariables }>(async (c, next) => {
    const user = c.get('user');
    if (user.role !== 'admin') {
      return c.json(createApiError(ERROR_CODES.FORBIDDEN, 'Admin access required'), 403);
    }
    await next();
  });
}
