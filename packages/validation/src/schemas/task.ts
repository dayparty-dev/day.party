import { z } from 'zod';

const estimatedMinutesSchema = z.number().int().min(0).max(2880);

export const taskEssentialitySchema = z.enum(['essential', 'normal', 'optional']);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  size: z.number().int().min(1).max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>,
  tagKey: z.string().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  estimatedMinutes: estimatedMinutesSchema.optional(),
  essentiality: taskEssentialitySchema.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  size: (z.number().int().min(1).max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>).optional(),
  tagKey: z.string().nullable().optional(),
  isComplete: z.boolean().optional(),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional(),
  estimatedMinutes: estimatedMinutesSchema.optional(),
  essentiality: taskEssentialitySchema.optional(),
});

export const reorderTasksSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  taskIds: z.array(z.string()).min(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
