import type { RewardDefinition } from '@dayparty/core';

export type { RewardDefinition, RewardDefinitionType } from '@dayparty/core';

export interface RewardDefinitionRepository {
  listByUserId(userId: string): Promise<RewardDefinition[]>;
  findById(id: string): Promise<RewardDefinition | null>;
  create(definition: Omit<RewardDefinition, 'id'>): Promise<RewardDefinition>;
}
