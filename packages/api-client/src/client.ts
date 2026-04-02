import type {
  ApiError,
  DayFit,
  DayWindow,
  Tag,
  Task,
  TaskSize,
  User,
  UserPreferences,
  VisualPreset,
} from '@dayparty/core';
import { ERROR_CODES } from '@dayparty/core';
import {
  createTagSchema,
  createTaskSchema,
  daySuggestionsQuerySchema,
  fromZodError,
  loginSchema,
  patchUserPreferencesSchema,
  reorderTasksSchema,
  taskTriageSchema,
  updateTagSchema,
  updateTaskSchema,
} from '@dayparty/validation';
import type {
  CreateTagInput,
  CreateTaskInput,
  DaySuggestionsQuery,
  LoginInput,
  PatchUserPreferencesInput,
  ReorderTasksInput,
  TaskTriageInput,
  UpdateTagInput,
  UpdateTaskInput,
} from '@dayparty/validation';

export type Result<T, E = ApiError> = { ok: true; data: T } | { ok: false; error: E };

type AuthUser = Pick<User, 'id' | 'email' | 'displayName' | 'role'>;

type ApiTask = Omit<Task, 'userId'>;
/** Rundown row — no `notesMarkdown`; optional `notesPreview` (contract P3). */
type ApiRundownTask = Omit<ApiTask, 'notesMarkdown'> & { notesPreview?: string };
type ApiTag = Omit<Tag, 'userId'>;

export type DayCapacityHint = {
  date: string;
  remainingMinutes: number;
  availableMinutes: number;
  plannedMinutes: number;
};

export type DaySuggestionsResponse = { hints: DayCapacityHint[] };

interface ApiDayRundown {
  date: string;
  tasks: ApiRundownTask[];
  capacity: number;
  completed: number;
  dayFit: DayFit;
  dayWindow: DayWindow;
}

type ApiUserPreferences = Omit<UserPreferences, 'userId'>;

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

  async getUserPreferences(): Promise<Result<ApiUserPreferences>> {
    return this.request('/me/preferences', {
      method: 'GET',
      requiresAuth: true,
      parse: parseUserPreferences,
    });
  }

  async patchUserPreferences(input: PatchUserPreferencesInput): Promise<Result<ApiUserPreferences>> {
    const parsed = patchUserPreferencesSchema.safeParse(input);
    if (!parsed.success) {
      return this.fail(fromZodError(parsed.error));
    }
    if (Object.keys(parsed.data).length === 0) {
      return this.fail(createApiError(ERROR_CODES.VALIDATION_ERROR, 'At least one preference field is required'));
    }

    return this.request('/me/preferences', {
      method: 'PATCH',
      requiresAuth: true,
      body: parsed.data,
      parse: parseUserPreferences,
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

  async getTask(id: string): Promise<Result<ApiTask>> {
    return this.request(`/tasks/${encodeURIComponent(id)}`, {
      method: 'GET',
      requiresAuth: true,
      parse: parseTask,
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

  async triageTask(id: string, input: TaskTriageInput): Promise<Result<ApiTask>> {
    const parsed = taskTriageSchema.safeParse(input);
    if (!parsed.success) {
      return this.fail(fromZodError(parsed.error));
    }

    return this.request(`/tasks/${encodeURIComponent(id)}/triage`, {
      method: 'POST',
      requiresAuth: true,
      body: parsed.data,
      parse: parseTask,
    });
  }

  async getDaySuggestions(query: DaySuggestionsQuery): Promise<Result<DaySuggestionsResponse>> {
    const parsed = daySuggestionsQuerySchema.safeParse(query);
    if (!parsed.success) {
      return this.fail(fromZodError(parsed.error));
    }
    const q = `?fromDate=${encodeURIComponent(parsed.data.fromDate)}&toDate=${encodeURIComponent(parsed.data.toDate)}`;
    return this.request(`/tasks/suggestions${q}`, {
      method: 'GET',
      requiresAuth: true,
      parse: parseDaySuggestions,
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

  const status = isTaskStatus(input.status) ? input.status : input.isComplete ? 'done' : 'planned';
  const tagKey = typeof input.tagKey === 'string' ? input.tagKey : undefined;
  const estimatedMinutes = typeof input.estimatedMinutes === 'number' ? input.estimatedMinutes : undefined;
  const essentiality = isTaskEssentiality(input.essentiality) ? input.essentiality : undefined;
  const deferredToDate = typeof input.deferredToDate === 'string' ? input.deferredToDate : undefined;
  const notesMarkdown = typeof input.notesMarkdown === 'string' ? input.notesMarkdown : undefined;

  return {
    id: input.id,
    title: input.title,
    size: input.size,
    status,
    ...(deferredToDate !== undefined ? { deferredToDate } : {}),
    ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
    ...(essentiality !== undefined ? { essentiality } : {}),
    ...(notesMarkdown !== undefined ? { notesMarkdown } : {}),
    tagKey,
    isComplete: input.isComplete,
    scheduledDate: input.scheduledDate,
    position: input.position,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

function parseRundownTaskRow(input: unknown): ApiRundownTask | null {
  const t = parseTask(input);
  if (!t) {
    return null;
  }
  const { notesMarkdown: _drop, ...rest } = t;
  const rec = input as Record<string, unknown>;
  const notesPreview = typeof rec.notesPreview === 'string' ? rec.notesPreview : undefined;
  return notesPreview !== undefined ? { ...rest, notesPreview } : { ...rest };
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

  const tasks: ApiRundownTask[] = [];
  for (const task of input.tasks) {
    const parsed = parseRundownTaskRow(task);
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

function isTaskStatus(value: unknown): value is Task['status'] {
  return (
    value === 'planned' || value === 'in_progress' || value === 'done' || value === 'skipped' || value === 'deferred'
  );
}

function parseDaySuggestions(input: unknown): DaySuggestionsResponse | null {
  if (!isRecord(input) || !Array.isArray(input.hints)) {
    return null;
  }
  const hints: DayCapacityHint[] = [];
  for (const h of input.hints) {
    if (!isRecord(h) || typeof h.date !== 'string') {
      return null;
    }
    if (
      typeof h.remainingMinutes !== 'number' ||
      typeof h.availableMinutes !== 'number' ||
      typeof h.plannedMinutes !== 'number'
    ) {
      return null;
    }
    hints.push({
      date: h.date,
      remainingMinutes: h.remainingMinutes,
      availableMinutes: h.availableMinutes,
      plannedMinutes: h.plannedMinutes,
    });
  }
  return { hints };
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

function isVisualPreset(value: unknown): value is VisualPreset {
  return value === 'default' || value === 'calm' || value === 'playful' || value === 'highContrast';
}

function parseSizeToMinutesOverrides(input: unknown): Partial<Record<TaskSize, number>> | undefined | null {
  /** API / Mongo may serialize absent overrides as JSON `null`. */
  if (input === undefined || input === null) {
    return undefined;
  }
  if (!isRecord(input)) {
    return null;
  }
  const out: Partial<Record<TaskSize, number>> = {};
  for (const size of [1, 2, 3, 4, 5] as const) {
    const key = String(size);
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const v = input[key];
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 2880) {
        return null;
      }
      out[size] = v;
    }
  }
  return out;
}

function parseUserPreferences(input: unknown): ApiUserPreferences | null {
  if (!isRecord(input)) {
    return null;
  }
  const dayWindow = parseDayWindow(input.dayWindow);
  if (!dayWindow) {
    return null;
  }
  if (!isVisualPreset(input.visualPreset) || typeof input.updatedAt !== 'string') {
    return null;
  }
  const sizeToMinutes = parseSizeToMinutesOverrides(input.sizeToMinutes);
  if (input.sizeToMinutes != null && sizeToMinutes === null) {
    return null;
  }
  return {
    dayWindow,
    visualPreset: input.visualPreset,
    updatedAt: input.updatedAt,
    ...(sizeToMinutes && Object.keys(sizeToMinutes).length > 0 ? { sizeToMinutes } : {}),
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
  ApiRundownTask as TaskRundownItemResponse,
  ApiTag as TagResponse,
  ApiTask as TaskResponse,
  ApiUserPreferences as UserPreferencesResponse,
  AuthUser as AuthUserResponse,
  ClientOptions,
  CreateTagInput,
  CreateTaskInput,
  DaySuggestionsQuery,
  LoginInput,
  PatchUserPreferencesInput,
  ReorderTasksInput,
  TaskTriageInput,
  UpdateTagInput,
  UpdateTaskInput,
  VerifyResponse,
};
