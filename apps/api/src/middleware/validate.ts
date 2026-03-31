import { fromZodError } from '@dayparty/validation';
import { createMiddleware } from 'hono/factory';
import type { z } from 'zod';
import type { ApiVariables } from '../types.js';

/**
 * Validates JSON body with a Zod schema. On failure returns 422 with ApiError from fromZodError().
 * On success sets `validatedJson` in context for the next handler.
 */
export function validateJsonBody<S extends z.ZodTypeAny>(schema: S) {
  return createMiddleware<{
    Variables: ApiVariables & { validatedJson: z.infer<S> };
  }>(async (c, next) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    c.set('validatedJson', parsed.data);
    await next();
  });
}
