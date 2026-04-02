import { z } from 'zod';

export const rewardDefinitionTypeSchema = z.enum(['instant', 'banked', 'scheduled']);

export const createRewardDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: rewardDefinitionTypeSchema,
  costCurrency: z.number().int().min(0).max(1_000_000_000),
  metadata: z.record(z.unknown()).optional(),
});

export const marketplacePurchaseSchema = z.object({
  rewardDefinitionId: z.string().trim().min(1),
});

export const ledgerQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
});

export type CreateRewardDefinitionInput = z.infer<typeof createRewardDefinitionSchema>;
export type MarketplacePurchaseInput = z.infer<typeof marketplacePurchaseSchema>;
