/** How the reward is delivered when redeemed (data-model.md, FR-007, FR-008). */
export type RewardDefinitionType = 'instant' | 'banked' | 'scheduled';

/** User- or system-defined catalog item purchasable with app currency. */
export interface RewardDefinition {
  id: string;
  userId: string;
  name: string;
  type: RewardDefinitionType;
  /** Price in app currency. */
  costCurrency: number;
  /** Optional scheduling rules or other provider-specific data. */
  metadata?: Record<string, unknown>;
}
