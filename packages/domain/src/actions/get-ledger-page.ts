import type { LedgerListParams, LedgerRepository } from '../interfaces/ledger-repository';

export type LedgerPageResult = Awaited<ReturnType<LedgerRepository['listByUserId']>> & { balance: number };

export function makeGetLedgerPageAction(ledgerRepo: LedgerRepository) {
  return async (userId: string, params: LedgerListParams): Promise<LedgerPageResult> => {
    const [list, balance] = await Promise.all([
      ledgerRepo.listByUserId(userId, params),
      ledgerRepo.sumAmountByUserId(userId),
    ]);
    return { ...list, balance };
  };
}
