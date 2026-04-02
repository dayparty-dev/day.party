/** Why the ledger line was recorded (data-model.md). */
export type LedgerEntryReason = 'task_completion' | 'purchase' | 'adjustment';

/** Append-only currency movement for a user; balance is sum of `amount`. */
export interface LedgerEntry {
  id: string;
  userId: string;
  /** Positive credit, negative debit. */
  amount: number;
  reason: LedgerEntryReason;
  /** Idempotency / link to task or purchase. */
  correlation?: string;
  createdAt: string;
}
