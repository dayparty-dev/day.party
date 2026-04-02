import type { PlanHistoryEvent } from '@dayparty/core';

export type { PlanHistoryEvent } from '@dayparty/core';

export type PlanHistoryAppendInput = {
  userId: string;
  type: string;
  entityId: string;
  payload: Record<string, unknown>;
  correlation?: string;
};

export interface PlanHistoryListParams {
  limit: number;
  cursor?: string;
  /** Newest first (default) or oldest first */
  order?: 'asc' | 'desc';
}

export interface PlanHistoryListResult {
  events: PlanHistoryEvent[];
  nextCursor?: string;
}

export interface PlanHistoryRepository {
  /**
   * Inserts one event (assigns id + timestamp). Returns null if correlation was supplied and an
   * event with the same userId + correlation already exists.
   */
  append(input: PlanHistoryAppendInput): Promise<PlanHistoryEvent | null>;
  listByUserId(userId: string, params: PlanHistoryListParams): Promise<PlanHistoryListResult>;
}
