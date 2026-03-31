import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerErrorHandler } from './middleware/error-handler';
import { createAuthRoutes } from './routes/auth';
import { createTagRoutes } from './routes/tags';
import { createTaskRoutes } from './routes/tasks';
import type { ApiEnv, ApiVariables } from './types';

function corsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (raw?.trim()) {
    return raw.split(',').map((o) => o.trim());
  }
  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

export function createApp(env: ApiEnv): Hono<{ Variables: ApiVariables }> {
  const app = new Hono<{ Variables: ApiVariables }>();
  registerErrorHandler(app);
  app.use(
    '*',
    cors({
      origin: corsOrigins(),
      allowHeaders: ['Authorization', 'Content-Type'],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      maxAge: 86_400,
    }),
  );
  app.get('/health', (c) => c.json({ status: 'ok', service: '@dayparty/api' }));
  app.route('/api/auth', createAuthRoutes(env));
  app.route('/api/tasks', createTaskRoutes(env));
  app.route('/api/tags', createTagRoutes(env));
  return app;
}
