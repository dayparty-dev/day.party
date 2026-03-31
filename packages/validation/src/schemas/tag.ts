import { z } from 'zod';

const hexColor = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Must be a valid hex color (#RGB or #RRGGBB)');

export const createTagSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Must be lowercase alphanumeric and hyphens only'),
  displayName: z.string().min(1).max(100),
  color: hexColor.optional(),
  icon: z.string().optional(),
});

export const updateTagSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  color: hexColor.nullable().optional(),
  icon: z.string().nullable().optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
