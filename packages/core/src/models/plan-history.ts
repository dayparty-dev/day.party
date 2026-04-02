/**
 * Append-only plan audit events (FR-010). Payload must not store secrets.
 */
export interface PlanHistoryEvent {
  id: string;
  userId: string;
  timestamp: string;
  /** e.g. task.created, task.updated, plan.reordered */
  type: string;
  /** Task id, calendar date for reorder, or user id for preferences */
  entityId: string;
  payload: Record<string, unknown>;
  /** When set, append is skipped if the same user already has this correlation (retry idempotency). */
  correlation?: string;
}
