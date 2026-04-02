import type { RewardDefinition } from '@dayparty/core';
import type { PlanHistoryRepository } from '../interfaces/plan-history-repository';
import type { RewardDefinitionRepository } from '../interfaces/reward-definition-repository';

export function makeListRewardDefinitionsAction(repo: RewardDefinitionRepository) {
  return (userId: string) => repo.listByUserId(userId);
}

export function makeCreateRewardDefinitionAction(repo: RewardDefinitionRepository, historyRepo: PlanHistoryRepository) {
  return async (userId: string, def: Omit<RewardDefinition, 'id' | 'userId'>): Promise<RewardDefinition> => {
    const created = await repo.create({ ...def, userId });
    await historyRepo.append({
      userId,
      type: 'reward.created',
      entityId: created.id,
      payload: { name: created.name, type: created.type, costCurrency: created.costCurrency },
    });
    return created;
  };
}
