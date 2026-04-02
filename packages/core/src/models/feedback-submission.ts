export type FeedbackCategory = 'bug' | 'idea' | 'other';

export interface FeedbackSubmission {
  id: string;
  userId: string;
  message: string;
  category?: FeedbackCategory;
  createdAt: string;
  userAgent?: string;
}
