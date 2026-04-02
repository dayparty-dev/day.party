/**
 * Composition root (FR-004)
 *
 * Construct repositories and domain actions here and pass the resulting `env`
 * into `createApp`. New server-side repos or actions belong in this wiring
 * (or a small extracted builder per `specs/002-tidy-arch-alignment/research.md`),
 * not in hidden globals.
 */
import './load-env';
import { serve } from '@hono/node-server';
import {
  getDb,
  MongoSessionRepository,
  MongoTagRepository,
  MongoTaskRepository,
  MongoUserPreferencesRepository,
  MongoUserRepository,
} from '@dayparty/db';
import {
  makeCreateTaskAction,
  makeDeleteTaskAction,
  makeGetRundownAction,
  makeReorderTasksAction,
  makeUpdateTaskAction,
} from '@dayparty/domain';
import { createApp } from './app';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
const MONGODB_DB = process.env.MONGODB_DB ?? 'dayparty';

const db = await getDb(MONGODB_URI, MONGODB_DB);
const taskRepo = new MongoTaskRepository(db);
const userRepo = new MongoUserRepository(db);
const sessionRepo = new MongoSessionRepository(db);
const tagRepo = new MongoTagRepository(db);
const userPrefsRepo = new MongoUserPreferencesRepository(db);

const env = {
  taskRepo,
  userRepo,
  sessionRepo,
  tagRepo,
  userPrefsRepo,
  createTask: makeCreateTaskAction(taskRepo, tagRepo),
  getRundown: makeGetRundownAction(taskRepo, userPrefsRepo),
  reorderTasks: makeReorderTasksAction(taskRepo, userPrefsRepo),
  deleteTask: makeDeleteTaskAction(taskRepo),
  updateTask: makeUpdateTaskAction(taskRepo, tagRepo),
};

const app = createApp(env);
const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`@dayparty/api listening on http://localhost:${info.port}`);
});
