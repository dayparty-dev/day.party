import type { ApiLedgerEntry, ApiRewardDefinition } from '@dayparty/api-client';
import type { EventData, Page } from '@nativescript/core';
import { Observable, ObservableArray } from '@nativescript/core';

import { authState } from '../services/auth-state';
import { isLikelyNetworkFailure } from '../utils/network-error';

const REWARD_TYPES = ['instant', 'banked', 'scheduled'] as const;

function formatLedgerLine(e: ApiLedgerEntry): string {
  const d = new Date(e.createdAt);
  const when = Number.isNaN(d.getTime()) ? e.createdAt : d.toLocaleString();
  return `${when} · ${e.reason.replace(/_/g, ' ')}`;
}

type RewardRow = {
  name: string;
  metaLine: string;
  buyButtonText: string;
  buyEnabled: boolean;
  onBuyTap: () => void;
};

type LedgerRow = {
  line: string;
  amountText: string;
  amountClass: string;
};

class RewardsViewModel extends Observable {
  rewardRows = new ObservableArray<RewardRow>();
  ledgerRows = new ObservableArray<LedgerRow>();

  private purchaseBusyId: string | null = null;
  private currentBalance = 0;
  private currentRewards: ApiRewardDefinition[] = [];

  constructor() {
    super();
    this.set('balanceLabel', 'Saldo: —');
    this.set('loadError', '');
    this.set('loadErrorVisibility', 'collapse');
    this.set('networkBanner', '');
    this.set('networkBannerVisibility', 'collapse');
    this.set('newRewardName', '');
    this.set('newRewardCost', '10');
    this.set('rewardTypeLabels', ['Al instante', 'Acumulable', 'Programado']);
    this.set('rewardTypeIndex', 0);
    this.set('createRewardError', '');
    this.set('createRewardSaving', false);
    this.set('createRewardEnabled', true);
    this.set('createRewardButtonText', 'Guardar en catálogo');
    this.set('emptyCatalogVisibility', 'collapse');
  }

  private rebuildRewardRows(): void {
    while (this.rewardRows.length > 0) {
      this.rewardRows.pop();
    }
    const busy = this.purchaseBusyId;
    const balance = this.currentBalance;
    for (const r of this.currentRewards) {
      const id = r.id;
      this.rewardRows.push({
        name: r.name,
        metaLine: `${r.type} · ${r.costCurrency} pts`,
        buyButtonText: busy === id ? '…' : 'Comprar',
        buyEnabled: busy === null && balance >= r.costCurrency,
        onBuyTap: () => {
          void this.onPurchase(id);
        },
      });
    }
  }

  private rebuildLedgerRows(entries: ApiLedgerEntry[]): void {
    while (this.ledgerRows.length > 0) {
      this.ledgerRows.pop();
    }
    for (const e of entries) {
      const sign = e.amount >= 0 ? '+' : '';
      this.ledgerRows.push({
        line: formatLedgerLine(e),
        amountText: `${sign}${e.amount}`,
        amountClass: e.amount >= 0 ? 'ledger-amount-credit' : 'ledger-amount-debit',
      });
    }
  }

  async loadAll(): Promise<void> {
    this.set('loadErrorVisibility', 'collapse');
    this.set('networkBannerVisibility', 'collapse');
    const client = authState.getClient();
    const [rRes, lRes] = await Promise.all([client.getRewards(), client.getLedger({ limit: 30 })]);
    if (authState.consumeUnauthorized(rRes)) {
      return;
    }
    if (authState.consumeUnauthorized(lRes)) {
      return;
    }
    if (rRes.ok === false) {
      if (isLikelyNetworkFailure(rRes.error)) {
        this.set('networkBanner', rRes.error.message);
        this.set('networkBannerVisibility', 'visible');
        return;
      }
      this.set('loadError', rRes.error.message);
      this.set('loadErrorVisibility', 'visible');
      return;
    }
    if (lRes.ok === false) {
      if (isLikelyNetworkFailure(lRes.error)) {
        this.set('networkBanner', lRes.error.message);
        this.set('networkBannerVisibility', 'visible');
        return;
      }
      this.set('loadError', lRes.error.message);
      this.set('loadErrorVisibility', 'visible');
      return;
    }
    this.currentRewards = rRes.data;
    this.currentBalance = lRes.data.balance;
    this.set('balanceLabel', `Saldo: ${lRes.data.balance}`);
    this.set('emptyCatalogVisibility', rRes.data.length === 0 ? 'visible' : 'collapse');
    this.rebuildRewardRows();
    this.rebuildLedgerRows(lRes.data.entries);
  }

  onLoaded(): void {
    void this.loadAll();
  }

  onBack(): void {
    authState.navigateToRundown();
  }

  onRetry(): void {
    void this.loadAll();
  }

  async onCreateReward(): Promise<void> {
    if (this.get('createRewardSaving') === true) {
      return;
    }
    const name = String(this.get('newRewardName') ?? '').trim();
    if (!name) {
      this.set('createRewardError', 'Escribe un nombre.');
      return;
    }
    const costRaw = String(this.get('newRewardCost') ?? '').trim();
    const costNum = costRaw === '' ? 0 : Math.floor(Number(costRaw));
    if (!Number.isFinite(costNum) || costNum < 0) {
      this.set('createRewardError', 'Coste inválido (número ≥ 0).');
      return;
    }
    const idx = Number(this.get('rewardTypeIndex'));
    const type = REWARD_TYPES[Math.max(0, Math.min(REWARD_TYPES.length - 1, Math.floor(idx)))]!;
    this.set('createRewardError', '');
    this.set('createRewardSaving', true);
    this.set('createRewardEnabled', false);
    this.set('createRewardButtonText', 'Guardando…');
    const client = authState.getClient();
    const result = await client.createRewardDefinition({
      name,
      type,
      costCurrency: costNum,
    });
    this.set('createRewardSaving', false);
    this.set('createRewardEnabled', true);
    this.set('createRewardButtonText', 'Guardar en catálogo');
    if (authState.consumeUnauthorized(result)) {
      return;
    }
    if (result.ok === false) {
      if (isLikelyNetworkFailure(result.error)) {
        this.set('networkBanner', result.error.message);
        this.set('networkBannerVisibility', 'visible');
        return;
      }
      this.set('createRewardError', result.error.message);
      return;
    }
    this.set('newRewardName', '');
    await this.loadAll();
  }

  async onPurchase(rewardId: string): Promise<void> {
    if (this.purchaseBusyId !== null) {
      return;
    }
    this.purchaseBusyId = rewardId;
    this.rebuildRewardRows();
    const client = authState.getClient();
    const result = await client.purchaseReward(rewardId);
    this.purchaseBusyId = null;
    this.rebuildRewardRows();
    if (authState.consumeUnauthorized(result)) {
      return;
    }
    if (result.ok === false) {
      if (isLikelyNetworkFailure(result.error)) {
        this.set('networkBanner', result.error.message);
        this.set('networkBannerVisibility', 'visible');
        return;
      }
      this.set('loadError', result.error.message);
      this.set('loadErrorVisibility', 'visible');
      return;
    }
    this.currentBalance = result.data.balance;
    this.set('balanceLabel', `Saldo: ${result.data.balance}`);
    await this.loadAll();
  }
}

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  page.bindingContext = new RewardsViewModel();
}

export function onLoaded(args: EventData): void {
  const page = args.object as Page;
  (page.bindingContext as RewardsViewModel).onLoaded();
}
