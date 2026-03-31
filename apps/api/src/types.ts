import type { DayRundown, Task, User } from '@dayparty/core';
import type {
  MongoSessionRepository,
  MongoTagRepository,
  MongoTaskRepository,
  MongoUserRepository,
} from '@dayparty/db';
import type { CreateTaskInput, UpdateTaskInput } from '@dayparty/domain';

export type ApiEnv = {
  userRepo: MongoUserRepository;
  sessionRepo: MongoSessionRepository;
  tagRepo: MongoTagRepository;
  taskRepo: MongoTaskRepository;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  getRundown: (userId: string, date: string) => Promise<DayRundown>;
  reorderTasks: (userId: string, date: string, taskIds: string[]) => Promise<DayRundown>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
};

export type ApiVariables = {
  user: User;
  /** Set by validateJsonBody() when body validation succeeds */
  validatedJson?: unknown;
};
