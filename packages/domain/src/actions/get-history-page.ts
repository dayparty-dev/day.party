import type {
  PlanHistoryListParams,
  PlanHistoryListResult,
  PlanHistoryRepository,
} from '../interfaces/plan-history-repository';

export function makeGetHistoryPageAction(repo: PlanHistoryRepository) {
  return async (userId: string, params: PlanHistoryListParams): Promise<PlanHistoryListResult> => {
    return repo.listByUserId(userId, params);
  };
}
