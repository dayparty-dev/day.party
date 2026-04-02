/** Importance for runway / overflow handling (FR-001, FR-003). */
export type TaskEssentiality = 'essential' | 'normal' | 'optional';

/** Lifecycle / triage state (data-model.md, FR-004, US2). */
export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'skipped' | 'deferred';

/**
 * Optional reward config on a task (P4): currency bounty, tag scope, and
 * “high resistance” handling for harder completions.
 */
export interface TaskBounty {
  amount: number;
  tagKeys?: string[];
  highResistance?: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  size: 1 | 2 | 3 | 4 | 5;
  /** Canonical estimate for day fit; legacy rows infer from `size` when absent. */
  estimatedMinutes?: number;
  /** Defaults to effective `normal` when omitted. */
  essentiality?: TaskEssentiality;
  /** Defaults to `planned` when omitted in persistence; kept in sync with `isComplete` for `done`. */
  status: TaskStatus;
  /** When status is `deferred`, target calendar day for reconsideration (YYYY-MM-DD). */
  deferredToDate?: string;
  tagKey?: string;
  isComplete: boolean;
  scheduledDate: string;
  position: number;
  /** Markdown source for expanded notes (FR-006); omitted from rundown JSON. */
  notesMarkdown?: string;
  /** Optional reward config (data-model.md P4). */
  bounty?: TaskBounty;
  /**
   * Cumulative focused seconds (excluding the current open in_progress session).
   * Updated server-side when leaving `in_progress` or completing.
   */
  focusedSecondsTotal?: number;
  /** ISO time when the current in_progress session started; only meaningful while `in_progress`. */
  focusSessionStartedAt?: string;
  createdAt: string;
  updatedAt: string;
}
