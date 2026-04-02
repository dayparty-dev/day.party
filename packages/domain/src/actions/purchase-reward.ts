import type { LedgerRepository } from '../interfaces/ledger-repository';
import type { RewardDefinitionRepository } from '../interfaces/reward-definition-repository';

function purchaseCorrelation(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return `purchase:${c.randomUUID()}`;
  }
  return `purchase:${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function makePurchaseRewardAction(rewardRepo: RewardDefinitionRepository, ledgerRepo: LedgerRepository) {
  return async (userId: string, rewardDefinitionId: string): Promise<{ balance: number }> => {
    const reward = await rewardRepo.findById(rewardDefinitionId);
    if (!reward || reward.userId !== userId) {
      throw new Error('Reward not found');
    }
    const balance = await ledgerRepo.sumAmountByUserId(userId);
    if (balance < reward.costCurrency) {
      throw new Error('Insufficient balance');
    }
    await ledgerRepo.insert({
      userId,
      amount: -reward.costCurrency,
      reason: 'purchase',
      correlation: purchaseCorrelation(),
    });
    return { balance: balance - reward.costCurrency };
  };
}
