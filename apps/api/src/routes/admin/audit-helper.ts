import type { AdminAuditEvent } from '@dayparty/core';
import type { AdminAuditRepository } from '@dayparty/domain';

export async function recordAdminAudit(
  repo: AdminAuditRepository,
  actorUserId: string,
  row: Pick<AdminAuditEvent, 'action' | 'targetType' | 'summary'> & {
    targetId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await repo.append({
    actorUserId,
    createdAt: new Date().toISOString(),
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    summary: row.summary,
    metadata: row.metadata,
  });
}
