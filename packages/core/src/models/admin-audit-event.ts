/** Append-only admin audit row (004 FR-008). */
export interface AdminAuditEvent {
  id: string;
  actorUserId: string;
  /** Stable action key, e.g. `user.view`, `task.patch`. */
  action: string;
  targetType: string;
  targetId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
