import type { RewardDefinition } from '@dayparty/core';
import type { RewardDefinitionRepository } from '../interfaces/reward-definition-repository';

export function makeListRewardDefinitionsAction(repo: RewardDefinitionRepository) {
  return (userId: string) => repo.listByUserId(userId);
}

export function makeCreateRewardDefinitionAction(repo: RewardDefinitionRepository) {
  return (userId: string, def: Omit<RewardDefinition, 'id' | 'userId'>) => repo.create({ ...def, userId });
}
