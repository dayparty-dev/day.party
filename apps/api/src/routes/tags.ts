import type { Tag } from '@dayparty/core';
import { ERROR_CODES } from '@dayparty/core';
import { createApiError, createTagSchema, fromZodError, updateTagSchema } from '@dayparty/validation';
import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import type { ApiEnv, ApiVariables } from '../types';

function tagPublic(tag: Tag): Omit<Tag, 'userId'> {
  const { userId: _u, ...rest } = tag;
  return rest;
}

export function createTagRoutes(env: ApiEnv) {
  const tags = new Hono<{ Variables: ApiVariables }>();
  const requireAuth = createAuthMiddleware(env);
  tags.use('/*', requireAuth);

  tags.get('/', async (c) => {
    const user = c.get('user');
    const list = await env.tagRepo.findByUser(user.id);
    return c.json(list.map(tagPublic));
  });

  tags.post('/', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const user = c.get('user');
    const existing = await env.tagRepo.findByKey(user.id, parsed.data.key);
    if (existing) {
      return c.json(createApiError(ERROR_CODES.CONFLICT, 'Tag key already exists'), 409);
    }
    const tag = await env.tagRepo.create({
      userId: user.id,
      ...parsed.data,
      isDefault: false,
    });
    return c.json(tagPublic(tag), 201);
  });

  tags.patch('/:id', async (c) => {
    const id = c.req.param('id');
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = updateTagSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const user = c.get('user');
    const all = await env.tagRepo.findByUser(user.id);
    const tag = all.find((t) => t.id === id);
    if (!tag) {
      return c.json(createApiError(ERROR_CODES.NOT_FOUND, 'Tag not found'), 404);
    }
    const patch = {
      ...parsed.data,
      color: parsed.data.color === null ? undefined : parsed.data.color,
      icon: parsed.data.icon === null ? undefined : parsed.data.icon,
    };
    const updated = await env.tagRepo.update(id, patch);
    if (!updated) {
      return c.json(createApiError(ERROR_CODES.NOT_FOUND, 'Tag not found'), 404);
    }
    return c.json(tagPublic(updated));
  });

  tags.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const all = await env.tagRepo.findByUser(user.id);
    const tag = all.find((t) => t.id === id);
    if (!tag) {
      return c.json(createApiError(ERROR_CODES.NOT_FOUND, 'Tag not found'), 404);
    }
    await env.taskRepo.nullifyTagKeyForUser(user.id, tag.key);
    await env.tagRepo.delete(id);
    return c.json({ message: 'Deleted' });
  });

  return tags;
}
