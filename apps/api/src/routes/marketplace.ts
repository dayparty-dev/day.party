import { ERROR_CODES } from '@dayparty/core';
import { createApiError, fromZodError, marketplacePurchaseSchema } from '@dayparty/validation';
import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import type { ApiEnv, ApiVariables } from '../types';

export function createMarketplaceRoutes(env: ApiEnv) {
  const marketplace = new Hono<{ Variables: ApiVariables }>();
  const requireAuth = createAuthMiddleware(env);
  marketplace.use('/*', requireAuth);

  marketplace.post('/purchase', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = marketplacePurchaseSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const user = c.get('user');
    try {
      const result = await env.purchaseReward(user.id, parsed.data.rewardDefinitionId);
      return c.json(result);
    } catch (e) {
      if (e instanceof Error && e.message === 'Reward not found') {
        return c.json(createApiError(ERROR_CODES.NOT_FOUND, e.message), 404);
      }
      if (e instanceof Error && e.message === 'Insufficient balance') {
        return c.json(createApiError(ERROR_CODES.VALIDATION_ERROR, e.message, { balance: [e.message] }), 422);
      }
      throw e;
    }
  });

  return marketplace;
}
