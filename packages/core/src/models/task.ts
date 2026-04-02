/** Importance for runway / overflow handling (FR-001, FR-003). */
export type TaskEssentiality = 'essential' | 'normal' | 'optional';

/** Lifecycle / triage state (data-model.md, FR-004, US2). */
export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'skipped' | 'deferred';

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
  createdAt: string;
  updatedAt: string;
}
