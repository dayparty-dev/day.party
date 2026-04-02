import type { DayRundown, Task, User, UserPreferences } from '@dayparty/core';
import type {
  CreateTaskInput,
  SessionRepository,
  TagRepository,
  TaskRepository,
  UpdateTaskInput,
  UserPreferencesPatch,
  UserPreferencesRepository,
  UserRepository,
} from '@dayparty/domain';

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
  getUserPreferences: (userId: string) => Promise<UserPreferences>;
  patchUserPreferences: (userId: string, patch: UserPreferencesPatch) => Promise<UserPreferences>;
};

export type ApiVariables = {
  user: User;
  /** Set by validateJsonBody() when body validation succeeds */
  validatedJson?: unknown;
};
