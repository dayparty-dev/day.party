import type { Tag } from '../models/tag.js';
export declare const SIZE_SCALE: readonly [1, 2, 3, 4, 5];
export type TaskSize = (typeof SIZE_SCALE)[number];
export declare const DEFAULT_TAGS: Omit<Tag, 'id' | 'userId' | 'createdAt'>[];
export declare const ERROR_CODES: {
  readonly VALIDATION_ERROR: 'VALIDATION_ERROR';
  readonly UNAUTHORIZED: 'UNAUTHORIZED';
  readonly FORBIDDEN: 'FORBIDDEN';
  readonly NOT_FOUND: 'NOT_FOUND';
  readonly CONFLICT: 'CONFLICT';
  readonly INTERNAL_ERROR: 'INTERNAL_ERROR';
};
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
//# sourceMappingURL=index.d.ts.map
