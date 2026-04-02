/** Importance for runway / overflow handling (FR-001, FR-003). */
export type TaskEssentiality = 'essential' | 'normal' | 'optional';

export interface Task {
  id: string;
  userId: string;
  title: string;
  size: 1 | 2 | 3 | 4 | 5;
  /** Canonical estimate for day fit; legacy rows infer from `size` when absent. */
  estimatedMinutes?: number;
  /** Defaults to effective `normal` when omitted. */
  essentiality?: TaskEssentiality;
  tagKey?: string;
  isComplete: boolean;
  scheduledDate: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}
