import { z } from 'zod';

export const createFeedbackSchema = z.object({
  message: z.string().min(1).max(8000),
  category: z.enum(['bug', 'idea', 'other']).optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
