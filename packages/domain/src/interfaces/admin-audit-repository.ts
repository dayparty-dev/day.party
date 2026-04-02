import type { AdminAuditEvent } from '@dayparty/core';

export type AdminAuditListResult = {
  items: AdminAuditEvent[];
  nextCursor: string | null;
};

export interface AdminAuditRepository {
  append(row: Omit<AdminAuditEvent, 'id'> & { id?: string }): Promise<AdminAuditEvent>;
  listDescending(limit: number, cursor?: string | null): Promise<AdminAuditListResult>;
}
