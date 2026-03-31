import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export type LoginInput = z.infer<typeof loginSchema>;
