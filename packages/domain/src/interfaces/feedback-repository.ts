import type { FeedbackSubmission } from '@dayparty/core';

export type FeedbackListResult = {
  items: FeedbackSubmission[];
  nextCursor: string | null;
};

export interface FeedbackRepository {
  create(row: Omit<FeedbackSubmission, 'id' | 'createdAt'> & { createdAt?: string }): Promise<FeedbackSubmission>;
  listForAdmin(limit: number, cursor?: string | null): Promise<FeedbackListResult>;
}
