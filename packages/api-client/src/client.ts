import type { ApiError, DayFit, DayWindow, Tag, Task, User } from '@dayparty/core';
import { ERROR_CODES } from '@dayparty/core';
import {
  createTagSchema,
  createTaskSchema,
  fromZodError,
  loginSchema,
  reorderTasksSchema,
  updateTagSchema,
  updateTaskSchema,
} from '@dayparty/validation';
import type {
  CreateTagInput,
  CreateTaskInput,
  LoginInput,
  ReorderTasksInput,
  UpdateTagInput,
  UpdateTaskInput,
} from '@dayparty/validation';

export type Result<T, E = ApiError> = { ok: true; data: T } | { ok: false; error: E };

type AuthUser = Pick<User, 'id' | 'email' | 'displayName' | 'role'>;

type ApiTask = Omit<Task, 'userId'>;
type ApiTag = Omit<Tag, 'userId'>;

interface ApiDayRundown {
  date: string;
  tasks: ApiTask[];
  capacity: number;
  completed: number;
  dayFit: DayFit;
  dayWindow: DayWindow;
}

interface VerifyResponse {
  token: string;
  user: AuthUser;
}

interface ClientOptions {
  baseUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export class DayPartyClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private token: string | null;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.token = options.token ?? null;
  }

  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.token = null;
  }

  async login(email: string): Promise<Result<{ message: string }>> {
    const parsed = loginSchema.safeParse({ email });
    if (!parsed.success) {
      return this.fail(fromZodError(parsed.error));
    }

    return this.request('/auth/login', {
      method: 'POST',
      body: parsed.data,
      parse: parseMessageResponse,
    });
  }

  async verify(token: string): Promise<Result<VerifyResponse>> {
    const url = `/auth/verify?token=${encodeURIComponent(token)}`;
    const result = await this.request(url, {
      method: 'GET',
      parse: parseVerifyResponse,
    });

    if (result.ok) {
      this.token = result.data.token;
    }

    return result;
  }

  async logout(): Promise<Result<{ message: string }>> {
    const result = await this.request('/auth/logout', {
      method: 'POST',
      requiresAuth: true,
      parse: parseMessageResponse,
    });

    if (result.ok) {
      this.clearToken();
    }

    return result;
  }

  async me(): Promise<Result<AuthUser>> {
    return this.request('/auth/me', {
      method: 'GET',
      requiresAuth: true,
      parse: parseAuthUser,
    });
  }

  async getRundown(date: string): Promise<Result<ApiDayRundown>> {
    const query = `/tasks?date=${encodeURIComponent(date)}`;
    return this.request(query, {
      method: 'GET',
      requiresAuth: true,
      parse: parseDayRundown,
    });
  }

  async createTask(input: CreateTaskInput): Promise<Result<ApiTask>> {
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) {
      return this.fail(fromZodError(parsed.error));
    }

    return this.request('/tasks', {
      method: 'POST',
      requiresAuth: true,
      body: parsed.data,
      parse: parseTask,
    });
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Result<ApiTask>> {
    const parsed = updateTaskSchema.safeParse(input);
    if (!parsed.success) {
      return this.fail(fromZodError(parsed.error));
    }

    return this.request(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      requiresAuth: true,
      body: parsed.data,
      parse: parseTask,
    });
  }

  async deleteTask(id: string): Promise<Result<{ message: string }>> {
    return this.request(`/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      requiresAuth: true,
      parse: parseMessageResponse,
    });
  }

  async reorderTasks(input: ReorderTasksInput): Promise<Result<ApiDayRundown>> {
    const parsed = reorderTasksSchema.safeParse(input);
    if (!parsed.success) {
      return this.fail(fromZodError(parsed.error));
    }

    return this.request('/tasks/reorder', {
      method: 'PATCH',
      requiresAuth: true,
      body: parsed.data,
      parse: parseDayRundown,
    });
  }

  async getTags(): Promise<Result<ApiTag[]>> {
    return this.request('/tags', {
      method: 'GET',
      requiresAuth: true,
      parse: parseTagArray,
    });
  }

  async createTag(input: CreateTagInput): Promise<Result<ApiTag>> {
    const parsed = createTagSchema.safeParse(input);
    if (!parsed.success) {
      return this.fail(fromZodError(parsed.error));
    }

    return this.request('/tags', {
      method: 'POST',
      requiresAuth: true,
      body: parsed.data,
      parse: parseTag,
    });
  }

  async updateTag(id: string, input: UpdateTagInput): Promise<Result<ApiTag>> {
    const parsed = updateTagSchema.safeParse(input);
    if (!parsed.success) {
      return this.fail(fromZodError(parsed.error));
    }

    return this.request(`/tags/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      requiresAuth: true,
      body: parsed.data,
      parse: parseTag,
    });
  }

  async deleteTag(id: string): Promise<Result<{ message: string }>> {
    return this.request(`/tags/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      requiresAuth: true,
      parse: parseMessageResponse,
    });
  }

  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      parse: (input: unknown) => T | null;
      body?: unknown;
      requiresAuth?: boolean;
    },
  ): Promise<Result<T>> {
    if (options.requiresAuth && !this.token) {
      return this.fail(createApiError(ERROR_CODES.UNAUTHORIZED, 'Missing bearer token'));
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: options.method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      const payload = await readJson(response);

      if (!response.ok) {
        return this.fail(parseApiError(payload, response.status));
      }

      const parsed = options.parse(payload);
      if (!parsed) {
        return this.fail(createApiError(ERROR_CODES.INTERNAL_ERROR, 'Malformed API response'));
      }

      return { ok: true, data: parsed };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return this.fail(createApiError(ERROR_CODES.INTERNAL_ERROR, message));
    }
  }

  private fail<T>(error: ApiError): Result<T> {
    return { ok: false, error };
  }
}

function parseMessageResponse(input: unknown): { message: string } | null {
  if (!isRecord(input) || typeof input.message !== 'string') {
    return null;
  }
  return { message: input.message };
}

function parseVerifyResponse(input: unknown): VerifyResponse | null {
  if (!isRecord(input) || typeof input.token !== 'string') {
    return null;
  }

  const user = parseAuthUser(input.user);
  if (!user) {
    return null;
  }

  return {
    token: input.token,
    user,
  };
}

function parseAuthUser(input: unknown): AuthUser | null {
  if (!isRecord(input)) {
    return null;
  }

  if (typeof input.id !== 'string' || typeof input.email !== 'string') {
    return null;
  }

  const role = input.role === 'admin' || input.role === 'user' ? input.role : 'user';

  const displayName = typeof input.displayName === 'string' ? input.displayName : undefined;

  return {
    id: input.id,
    email: input.email,
    displayName,
    role,
  };
}

function parseTask(input: unknown): ApiTask | null {
  if (!isRecord(input)) {
    return null;
  }

  if (
    typeof input.id !== 'string' ||
    typeof input.title !== 'string' ||
    !isTaskSize(input.size) ||
    typeof input.isComplete !== 'boolean' ||
    typeof input.scheduledDate !== 'string' ||
    typeof input.position !== 'number' ||
    typeof input.createdAt !== 'string' ||
    typeof input.updatedAt !== 'string'
  ) {
    return null;
  }

  const tagKey = typeof input.tagKey === 'string' ? input.tagKey : undefined;
  const estimatedMinutes = typeof input.estimatedMinutes === 'number' ? input.estimatedMinutes : undefined;
  const essentiality = isTaskEssentiality(input.essentiality) ? input.essentiality : undefined;

  return {
    id: input.id,
    title: input.title,
    size: input.size,
    ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
    ...(essentiality !== undefined ? { essentiality } : {}),
    tagKey,
    isComplete: input.isComplete,
    scheduledDate: input.scheduledDate,
    position: input.position,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

function parseTag(input: unknown): ApiTag | null {
  if (!isRecord(input)) {
    return null;
  }

  if (
    typeof input.id !== 'string' ||
    typeof input.key !== 'string' ||
    typeof input.displayName !== 'string' ||
    typeof input.isDefault !== 'boolean' ||
    typeof input.createdAt !== 'string'
  ) {
    return null;
  }

  const color = typeof input.color === 'string' ? input.color : undefined;
  const icon = typeof input.icon === 'string' ? input.icon : undefined;

  return {
    id: input.id,
    key: input.key,
    displayName: input.displayName,
    color,
    icon,
    isDefault: input.isDefault,
    createdAt: input.createdAt,
  };
}

function parseTagArray(input: unknown): ApiTag[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const tags: ApiTag[] = [];
  for (const item of input) {
    const parsed = parseTag(item);
    if (!parsed) {
      return null;
    }
    tags.push(parsed);
  }

  return tags;
}

function parseDayRundown(input: unknown): ApiDayRundown | null {
  if (!isRecord(input)) {
    return null;
  }

  if (
    typeof input.date !== 'string' ||
    !Array.isArray(input.tasks) ||
    typeof input.capacity !== 'number' ||
    typeof input.completed !== 'number'
  ) {
    return null;
  }

  const dayFit = parseDayFit(input.dayFit);
  const dayWindow = parseDayWindow(input.dayWindow);
  if (!dayFit || !dayWindow) {
    return null;
  }

  const tasks: ApiTask[] = [];
  for (const task of input.tasks) {
    const parsed = parseTask(task);
    if (!parsed) {
      return null;
    }
    tasks.push(parsed);
  }

  return {
    date: input.date,
    tasks,
    capacity: input.capacity,
    completed: input.completed,
    dayFit,
    dayWindow,
  };
}

function parseApiError(input: unknown, status: number): ApiError {
  if (!isRecord(input)) {
    return statusToFallbackError(status);
  }

  if (typeof input.code !== 'string' || typeof input.message !== 'string') {
    return statusToFallbackError(status);
  }

  const fields = parseFields(input.fields);
  return {
    code: input.code,
    message: input.message,
    ...(fields ? { fields } : {}),
  };
}

function parseFields(input: unknown): Record<string, string[]> | undefined {
  if (!isRecord(input)) {
    return undefined;
  }

  const fields: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
      continue;
    }

    fields[key] = value;
  }

  return Object.keys(fields).length > 0 ? fields : undefined;
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function statusToFallbackError(status: number): ApiError {
  if (status === 401) {
    return createApiError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized');
  }

  if (status === 403) {
    return createApiError(ERROR_CODES.FORBIDDEN, 'Forbidden');
  }

  if (status === 404) {
    return createApiError(ERROR_CODES.NOT_FOUND, 'Not found');
  }

  if (status === 409) {
    return createApiError(ERROR_CODES.CONFLICT, 'Conflict');
  }

  if (status === 422) {
    return createApiError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed');
  }

  return createApiError(ERROR_CODES.INTERNAL_ERROR, 'Unexpected API error');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTaskSize(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isTaskEssentiality(value: unknown): value is NonNullable<Task['essentiality']> {
  return value === 'essential' || value === 'normal' || value === 'optional';
}

function parseDayWindow(input: unknown): DayWindow | null {
  if (!isRecord(input)) {
    return null;
  }
  if (
    typeof input.startMinuteOfDay !== 'number' ||
    typeof input.endMinuteOfDay !== 'number' ||
    typeof input.crossesMidnight !== 'boolean'
  ) {
    return null;
  }
  return {
    startMinuteOfDay: input.startMinuteOfDay,
    endMinuteOfDay: input.endMinuteOfDay,
    crossesMidnight: input.crossesMidnight,
  };
}

function parseDayFit(input: unknown): DayFit | null {
  if (!isRecord(input)) {
    return null;
  }
  if (
    typeof input.availableMinutes !== 'number' ||
    typeof input.plannedMinutes !== 'number' ||
    typeof input.overflowUnresolved !== 'boolean' ||
    !Array.isArray(input.inRunwayTaskIds) ||
    !Array.isArray(input.outsideRunwayTaskIds)
  ) {
    return null;
  }
  if (
    input.inRunwayTaskIds.some((id) => typeof id !== 'string') ||
    input.outsideRunwayTaskIds.some((id) => typeof id !== 'string')
  ) {
    return null;
  }
  return {
    availableMinutes: input.availableMinutes,
    plannedMinutes: input.plannedMinutes,
    inRunwayTaskIds: [...input.inRunwayTaskIds],
    outsideRunwayTaskIds: [...input.outsideRunwayTaskIds],
    overflowUnresolved: input.overflowUnresolved,
  };
}

function createApiError(code: string, message: string, fields?: Record<string, string[]>): ApiError {
  return { code, message, ...(fields ? { fields } : {}) };
}

export type {
  ApiDayRundown as DayRundownResponse,
  ApiTag as TagResponse,
  ApiTask as TaskResponse,
  AuthUser as AuthUserResponse,
  ClientOptions,
  CreateTagInput,
  CreateTaskInput,
  LoginInput,
  ReorderTasksInput,
  UpdateTagInput,
  UpdateTaskInput,
  VerifyResponse,
};
