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
  MongoAdminAuditRepository,
  MongoFeedbackRepository,
  MongoLedgerRepository,
  MongoPlanHistoryRepository,
  MongoRewardDefinitionRepository,
  MongoSessionRepository,
  MongoTagRepository,
  MongoTaskRepository,
  MongoUserPreferencesRepository,
  MongoUserRepository,
} from '@dayparty/db';
import {
  makeApplyTaskTriageAction,
  makeCreateRewardDefinitionAction,
  makeCreateTaskAction,
  makeDeleteTagWithPolicyAction,
  makeDeleteTaskAction,
  makeGetHistoryPageAction,
  makeGetLedgerPageAction,
  makeGetRundownAction,
  makeGetUserPreferencesAction,
  makeListRewardDefinitionsAction,
  makePatchUserPreferencesAction,
  makePurchaseRewardAction,
  makeReorderTasksAction,
  makeSubmitFeedbackAction,
  makeSuggestDayCapacitiesAction,
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
const rewardRepo = new MongoRewardDefinitionRepository(db);
const ledgerRepo = new MongoLedgerRepository(db);
const planHistoryRepo = new MongoPlanHistoryRepository(db);
const adminAuditRepo = new MongoAdminAuditRepository(db);
const feedbackRepo = new MongoFeedbackRepository(db);

const env = {
  taskRepo,
  userRepo,
  sessionRepo,
  tagRepo,
  userPrefsRepo,
  rewardRepo,
  ledgerRepo,
  createTask: makeCreateTaskAction(taskRepo, tagRepo, planHistoryRepo),
  getRundown: makeGetRundownAction(taskRepo, userPrefsRepo),
  reorderTasks: makeReorderTasksAction(taskRepo, userPrefsRepo, planHistoryRepo),
  deleteTask: makeDeleteTaskAction(taskRepo, planHistoryRepo),
  updateTask: makeUpdateTaskAction(taskRepo, tagRepo, ledgerRepo, planHistoryRepo),
  applyTaskTriage: makeApplyTaskTriageAction(taskRepo, planHistoryRepo),
  suggestDayCapacities: makeSuggestDayCapacitiesAction(taskRepo, userPrefsRepo),
  getUserPreferences: makeGetUserPreferencesAction(userPrefsRepo),
  patchUserPreferences: makePatchUserPreferencesAction(userPrefsRepo, planHistoryRepo),
  listRewardDefinitions: makeListRewardDefinitionsAction(rewardRepo),
  createRewardDefinition: makeCreateRewardDefinitionAction(rewardRepo, planHistoryRepo),
  getLedgerPage: makeGetLedgerPageAction(ledgerRepo),
  purchaseReward: makePurchaseRewardAction(rewardRepo, ledgerRepo, planHistoryRepo),
  getHistoryPage: makeGetHistoryPageAction(planHistoryRepo),
  deleteTagWithPolicy: makeDeleteTagWithPolicyAction(tagRepo, taskRepo),
  adminAuditRepo,
  feedbackRepo,
  submitFeedback: makeSubmitFeedbackAction(feedbackRepo),
};

const app = createApp(env);
const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`@dayparty/api listening on http://localhost:${info.port}`);
});
