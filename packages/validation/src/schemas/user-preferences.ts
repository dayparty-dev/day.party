import { z } from 'zod';

const minuteOfDay = z.number().int().min(0).max(1439);

export const dayWindowSchema = z
  .object({
    startMinuteOfDay: minuteOfDay,
    endMinuteOfDay: minuteOfDay,
    crossesMidnight: z.boolean(),
  })
  .superRefine((w, ctx) => {
    if (!w.crossesMidnight && w.startMinuteOfDay >= w.endMinuteOfDay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startMinuteOfDay must be less than endMinuteOfDay when crossesMidnight is false',
        path: ['startMinuteOfDay'],
      });
    }
    if (w.crossesMidnight && w.startMinuteOfDay <= w.endMinuteOfDay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startMinuteOfDay must be greater than endMinuteOfDay when crossesMidnight is true',
        path: ['startMinuteOfDay'],
      });
    }
  });

export const visualPresetSchema = z.enum(['default', 'calm', 'playful', 'highContrast']);

export const userLocaleSchema = z.enum(['en', 'es']);

export const colorSchemeSchema = z.enum(['system', 'light', 'dark']);

const minuteOverride = z.number().int().min(1).max(2880);

/** Partial overrides for size → minutes (keys 1–5 only). */
export const sizeToMinutesPartialSchema = z
  .object({
    1: minuteOverride.optional(),
    2: minuteOverride.optional(),
    3: minuteOverride.optional(),
    4: minuteOverride.optional(),
    5: minuteOverride.optional(),
  })
  .strict();

/** Body for `PATCH` user preferences (all fields optional). */
export const patchUserPreferencesSchema = z
  .object({
    dayWindow: dayWindowSchema.optional(),
    visualPreset: visualPresetSchema.optional(),
    sizeToMinutes: sizeToMinutesPartialSchema.optional(),
    locale: userLocaleSchema.optional(),
    colorScheme: colorSchemeSchema.optional(),
  })
  .strict();

export type PatchUserPreferencesInput = z.infer<typeof patchUserPreferencesSchema>;
