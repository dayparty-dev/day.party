import type { FeedbackCategory, FeedbackSubmission } from '@dayparty/core';
import type { FeedbackRepository } from '../interfaces/feedback-repository';

export function makeSubmitFeedbackAction(feedbackRepo: FeedbackRepository) {
  return async function submitFeedback(input: {
    userId: string;
    message: string;
    category?: FeedbackCategory;
    userAgent?: string;
  }): Promise<FeedbackSubmission> {
    return feedbackRepo.create({
      userId: input.userId,
      message: input.message,
      category: input.category,
      userAgent: input.userAgent,
    });
  };
}
