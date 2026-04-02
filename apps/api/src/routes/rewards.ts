import type { RewardDefinition } from '@dayparty/core';
import { createRewardDefinitionSchema, fromZodError } from '@dayparty/validation';
import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import type { ApiEnv, ApiVariables } from '../types';

function rewardPublic(def: RewardDefinition): Omit<RewardDefinition, 'userId'> {
  const { userId: _u, ...rest } = def;
  return rest;
}

export function createRewardRoutes(env: ApiEnv) {
  const rewards = new Hono<{ Variables: ApiVariables }>();
  const requireAuth = createAuthMiddleware(env);
  rewards.use('/*', requireAuth);

  rewards.get('/', async (c) => {
    const user = c.get('user');
    const list = await env.listRewardDefinitions(user.id);
    return c.json({ rewards: list.map(rewardPublic) });
  });

  rewards.post('/', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = createRewardDefinitionSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const user = c.get('user');
    const created = await env.createRewardDefinition(user.id, parsed.data);
    return c.json(rewardPublic(created), 201);
  });

  return rewards;
}
