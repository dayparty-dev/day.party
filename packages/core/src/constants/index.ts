import type { Tag } from '../models/tag';

export const SIZE_SCALE = [1, 2, 3, 4, 5] as const;

export type TaskSize = (typeof SIZE_SCALE)[number];

/** Default `size` → minutes when `estimatedMinutes` is absent (research.md §2). */
export const DEFAULT_SIZE_TO_MINUTES: Record<TaskSize, number> = {
  1: 15,
  2: 25,
  3: 40,
  4: 55,
  5: 75,
};

export const DEFAULT_TAGS: Omit<Tag, 'id' | 'userId' | 'createdAt'>[] = [
  { key: 'work', displayName: 'Work', isDefault: true },
  { key: 'health', displayName: 'Health', isDefault: true },
  { key: 'hobby', displayName: 'Hobby', isDefault: true },
  { key: 'errands', displayName: 'Errands', isDefault: true },
  { key: 'self-care', displayName: 'Self Care', isDefault: true },
];

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
