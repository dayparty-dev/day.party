import type {
  DayRundown,
  FeedbackCategory,
  FeedbackSubmission,
  RewardDefinition,
  Task,
  User,
  UserPreferences,
} from '@dayparty/core';
import type {
  AdminAuditRepository,
  CreateTaskInput,
  DaySuggestionsResult,
  DeleteTagWithPolicyResult,
  FeedbackRepository,
  LedgerListParams,
  LedgerPageResult,
  PlanHistoryListParams,
  PlanHistoryListResult,
  SessionRepository,
  TagRepository,
  TaskRepository,
  TaskTriageInput,
  UpdateTaskInput,
  UserPreferencesPatch,
  UserPreferencesRepository,
  UserRepository,
} from '@dayparty/domain';

/**
 * Shared API context. Auth: use `createAuthMiddleware` from `middleware/auth-middleware.ts` on routes that need a session;
 * for `/api/admin/*`, chain `createRequireAdmin` from `middleware/admin-middleware.ts` **after** auth.
 */
export type ApiEnv = {
  userRepo: UserRepository;
  sessionRepo: SessionRepository;
  tagRepo: TagRepository;
  taskRepo: TaskRepository;
  userPrefsRepo: UserPreferencesRepository;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  getRundown: (userId: string, date: string) => Promise<DayRundown>;
  reorderTasks: (userId: string, date: string, taskIds: string[]) => Promise<DayRundown>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  applyTaskTriage: (userId: string, taskId: string, input: TaskTriageInput) => Promise<Task>;
  suggestDayCapacities: (userId: string, fromDate: string, toDate: string) => Promise<DaySuggestionsResult>;
  getUserPreferences: (userId: string) => Promise<UserPreferences>;
  patchUserPreferences: (userId: string, patch: UserPreferencesPatch) => Promise<UserPreferences>;
  listRewardDefinitions: (userId: string) => Promise<RewardDefinition[]>;
  createRewardDefinition: (userId: string, input: Omit<RewardDefinition, 'id' | 'userId'>) => Promise<RewardDefinition>;
  getLedgerPage: (userId: string, params: LedgerListParams) => Promise<LedgerPageResult>;
  purchaseReward: (userId: string, rewardDefinitionId: string) => Promise<{ balance: number }>;
  getHistoryPage: (userId: string, params: PlanHistoryListParams) => Promise<PlanHistoryListResult>;
  deleteTagWithPolicy: (
    userId: string,
    tagId: string,
    replacementTagId: string | null | undefined,
  ) => Promise<DeleteTagWithPolicyResult>;
  adminAuditRepo: AdminAuditRepository;
  feedbackRepo: FeedbackRepository;
  submitFeedback: (input: {
    userId: string;
    message: string;
    category?: FeedbackCategory;
    userAgent?: string;
  }) => Promise<FeedbackSubmission>;
};

export type ApiVariables = {
  user: User;
  /** Set by validateJsonBody() when body validation succeeds */
  validatedJson?: unknown;
};
