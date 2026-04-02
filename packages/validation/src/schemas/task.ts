import { z } from 'zod';

const estimatedMinutesSchema = z.number().int().min(0).max(2880);

/** P3 notes — size cap per data-model / research.md §6 */
const notesMarkdownSchema = z.string().max(32_000);

export const taskEssentialitySchema = z.enum(['essential', 'normal', 'optional']);

export const taskStatusSchema = z.enum(['planned', 'in_progress', 'done', 'skipped', 'deferred']);

export const taskBountySchema = z.object({
  amount: z.number().int().min(1).max(1_000_000),
  tagKeys: z.array(z.string()).optional(),
  highResistance: z.boolean().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  size: z.number().int().min(1).max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>,
  tagKey: z.string().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  estimatedMinutes: estimatedMinutesSchema.optional(),
  essentiality: taskEssentialitySchema.optional(),
  notesMarkdown: notesMarkdownSchema.optional(),
  bounty: taskBountySchema.optional(),
});

const updateTaskFieldsSchema = z.object({
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
  status: taskStatusSchema.optional(),
  deferredToDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .nullable()
    .optional(),
  notesMarkdown: z.union([notesMarkdownSchema, z.literal('')]).optional(),
  bounty: z.union([taskBountySchema, z.null()]).optional(),
});

export const updateTaskSchema = updateTaskFieldsSchema
  .refine((d) => !(d.status === 'deferred' && (d.deferredToDate === undefined || d.deferredToDate === null)), {
    message: 'deferredToDate is required when status is deferred',
    path: ['deferredToDate'],
  })
  .refine(
    (d) => {
      if (d.deferredToDate === undefined || d.deferredToDate === null) {
        return true;
      }
      return d.status === 'deferred';
    },
    { message: 'deferredToDate is only valid when status is deferred', path: ['deferredToDate'] },
  );

/** Partial task patch for admin support routes (field shapes only; lifecycle coupling validated server-side). */
export const adminPatchTaskSchema = updateTaskFieldsSchema.partial();

export const taskTriageSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('defer_to_date'),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  }),
  z.object({ action: z.literal('demote') }),
  z.object({ action: z.literal('mark_skipped') }),
  z.object({ action: z.literal('clear_skipped') }),
]);

export const daySuggestionsQuerySchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export type TaskTriageInput = z.infer<typeof taskTriageSchema>;
export type DaySuggestionsQuery = z.infer<typeof daySuggestionsQuerySchema>;

export const reorderTasksSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  taskIds: z.array(z.string()).min(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
