import type { LedgerEntry } from '@dayparty/core';
import { ledgerQuerySchema, fromZodError } from '@dayparty/validation';
import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import type { ApiEnv, ApiVariables } from '../types';

function ledgerEntryPublic(entry: LedgerEntry): Omit<LedgerEntry, 'userId'> {
  const { userId: _u, ...rest } = entry;
  return rest;
}

export function createLedgerRoutes(env: ApiEnv) {
  const ledger = new Hono<{ Variables: ApiVariables }>();
  const requireAuth = createAuthMiddleware(env);
  ledger.use('/*', requireAuth);

  ledger.get('/', async (c) => {
    const raw = {
      limit: c.req.query('limit') ?? undefined,
      cursor: c.req.query('cursor') ?? undefined,
    };
    const parsed = ledgerQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const user = c.get('user');
    const page = await env.getLedgerPage(user.id, {
      limit: parsed.data.limit,
      ...(parsed.data.cursor ? { cursor: parsed.data.cursor } : {}),
    });
    return c.json({
      entries: page.entries.map(ledgerEntryPublic),
      balance: page.balance,
      ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
    });
  });

  return ledger;
}
