import type { LedgerEntry } from '@dayparty/core';

export type { LedgerEntry, LedgerEntryReason } from '@dayparty/core';

export interface LedgerListParams {
  limit: number;
  cursor?: string;
}

export interface LedgerListResult {
  entries: LedgerEntry[];
  nextCursor?: string;
}

export interface LedgerRepository {
  /** Append-only insert; implementation assigns id and createdAt. */
  insert(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry>;
  listByUserId(userId: string, params: LedgerListParams): Promise<LedgerListResult>;
  /** Used for idempotent bounty credit (one ledger line per task). */
  findByCorrelation(userId: string, correlation: string): Promise<LedgerEntry | null>;
  /** Sum of `amount` for the user (running balance). */
  sumAmountByUserId(userId: string): Promise<number>;
}
