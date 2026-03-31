import { ERROR_CODES } from '@dayparty/core';
import { createApiError, fromZodError, loginSchema } from '@dayparty/validation';
import { Hono } from 'hono';
import { mintBearerToken, mintMagicLinkToken, parseMagicLinkToken } from '../magic-link';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import type { ApiEnv, ApiVariables } from '../types';

function sessionExpiryIso(): string {
  const days = 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export function createAuthRoutes(env: ApiEnv) {
  const auth = new Hono<{ Variables: ApiVariables }>();
  const requireAuth = createAuthMiddleware(env);

  auth.post('/login', async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fromZodError(parsed.error), 422);
    }
    const magicToken = mintMagicLinkToken(parsed.data.email);
    const apiBase = trimTrailingSlash(process.env.API_PUBLIC_URL ?? 'http://localhost:3001');
    const webBase = trimTrailingSlash(process.env.WEB_PUBLIC_URL ?? 'http://localhost:5173');
    const verifyUrl = `${apiBase}/api/auth/verify?token=${encodeURIComponent(magicToken)}`;
    const webUrl = `${webBase}/login?token=${encodeURIComponent(magicToken)}`;
    console.info(`[auth] Magic link for ${parsed.data.email}: ${webUrl}`);
    console.info(`[auth] API verify URL (debug): ${verifyUrl}`);
    // Development convenience for iOS Simulator: avoid flaky copy/paste from Xcode.
    // This copies the verify URL directly into the simulator clipboard.
    console.info(`[auth] iOS simulator pbcopy command (verify): echo -n "${verifyUrl}" | xcrun simctl pbcopy booted`);
    // Also provide the web URL (mobile can extract the token from either).
    console.info(`[auth] iOS simulator pbcopy command (login): echo -n "${webUrl}" | xcrun simctl pbcopy booted`);
    return c.json({ message: 'Magic link sent' });
  });

  auth.get('/verify', async (c) => {
    const token = c.req.query('token');
    if (!token) {
      return c.json(createApiError(ERROR_CODES.UNAUTHORIZED, 'Missing token'), 401);
    }
    const payload = parseMagicLinkToken(token);
    if (!payload) {
      return c.json(createApiError(ERROR_CODES.UNAUTHORIZED, 'Invalid or expired magic link'), 401);
    }
    let user = await env.userRepo.findByEmail(payload.email);
    if (!user) {
      const local = payload.email.split('@')[0] ?? 'User';
      user = await env.userRepo.create({
        email: payload.email,
        displayName: local,
        role: 'user',
      });
      await env.tagRepo.seedDefaults(user.id);
    }
    const bearer = mintBearerToken();
    await env.sessionRepo.create({
      userId: user.id,
      token: bearer,
      expiresAt: sessionExpiryIso(),
    });
    return c.json({
      token: bearer,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  });

  auth.use('/logout', requireAuth);
  auth.post('/logout', async (c) => {
    const header = c.req.header('Authorization');
    const prefix = 'Bearer ';
    const raw = header?.startsWith(prefix) ? header.slice(prefix.length).trim() : '';
    if (raw) {
      await env.sessionRepo.deleteByToken(raw);
    }
    return c.json({ message: 'Logged out' });
  });

  auth.use('/me', requireAuth);
  auth.get('/me', (c) => {
    const user = c.get('user');
    return c.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });
  });

  return auth;
}
