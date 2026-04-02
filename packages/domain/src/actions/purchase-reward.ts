import type { LedgerRepository } from '../interfaces/ledger-repository';
import type { PlanHistoryRepository } from '../interfaces/plan-history-repository';
import type { RewardDefinitionRepository } from '../interfaces/reward-definition-repository';

function purchaseCorrelation(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return `purchase:${c.randomUUID()}`;
  }
  return `purchase:${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function makePurchaseRewardAction(
  rewardRepo: RewardDefinitionRepository,
  ledgerRepo: LedgerRepository,
  historyRepo: PlanHistoryRepository,
) {
  return async (userId: string, rewardDefinitionId: string): Promise<{ balance: number }> => {
    const reward = await rewardRepo.findById(rewardDefinitionId);
    if (!reward || reward.userId !== userId) {
      throw new Error('Reward not found');
    }
    const balance = await ledgerRepo.sumAmountByUserId(userId);
    if (balance < reward.costCurrency) {
      throw new Error('Insufficient balance');
    }
    const correlation = purchaseCorrelation();
    await ledgerRepo.insert({
      userId,
      amount: -reward.costCurrency,
      reason: 'purchase',
      correlation,
    });
    await historyRepo.append({
      userId,
      type: 'reward.purchased',
      entityId: rewardDefinitionId,
      payload: { name: reward.name, costCurrency: reward.costCurrency },
      correlation: `history-purchase:${correlation}`,
    });
    return { balance: balance - reward.costCurrency };
  };
}
