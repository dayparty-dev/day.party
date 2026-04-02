import type { ApiPlanHistoryEvent } from '@dayparty/api-client';
import type { EventData, Page } from '@nativescript/core';
import { Observable, ObservableArray } from '@nativescript/core';

import { authState } from '../services/auth-state';
import { isLikelyNetworkFailure } from '../utils/network-error';

type HistoryRow = {
  whenLine: string;
  typeLine: string;
  entityLine: string;
  payloadLine: string;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function formatType(type: string): string {
  return type.replace(/\./g, ' · ');
}

function payloadPreview(payload: Record<string, unknown>): string {
  try {
    const s = JSON.stringify(payload);
    return s.length > 200 ? `${s.slice(0, 200)}…` : s;
  } catch {
    return '…';
  }
}

function eventToRow(e: ApiPlanHistoryEvent): HistoryRow {
  return {
    whenLine: formatWhen(e.timestamp),
    typeLine: formatType(e.type),
    entityLine: e.entityId,
    payloadLine: payloadPreview(e.payload),
  };
}

class HistoryViewModel extends Observable {
  eventRows = new ObservableArray<HistoryRow>();

  private nextCursor: string | undefined;
  private moreBusy = false;

  constructor() {
    super();
    this.set('hintText', 'Cambios recientes en tareas, orden, preferencias y recompensas (más nuevos primero).');
    this.set('loadError', '');
    this.set('loadErrorVisibility', 'collapse');
    this.set('networkBanner', '');
    this.set('networkBannerVisibility', 'collapse');
    this.set('emptyVisibility', 'collapse');
    this.set('initialLoadingVisibility', 'visible');
    this.set('moreVisibility', 'collapse');
    this.set('moreButtonText', 'Cargar más');
    this.set('moreEnabled', true);
  }

  private clearRows(): void {
    while (this.eventRows.length > 0) {
      this.eventRows.pop();
    }
  }

  private async fetchPage(cursor?: string): Promise<void> {
    const client = authState.getClient();
    const res = await client.getHistory({
      limit: 25,
      order: 'desc',
      ...(cursor ? { cursor } : {}),
    });
    if (authState.consumeUnauthorized(res)) {
      return;
    }
    if (res.ok === false) {
      if (isLikelyNetworkFailure(res.error)) {
        this.set('networkBanner', res.error.message);
        this.set('networkBannerVisibility', 'visible');
        return;
      }
      this.set('loadError', res.error.message);
      this.set('loadErrorVisibility', 'visible');
      return;
    }
    for (const e of res.data.events) {
      this.eventRows.push(eventToRow(e));
    }
    this.nextCursor = res.data.nextCursor;
    this.set('moreVisibility', this.nextCursor != null ? 'visible' : 'collapse');
  }

  async loadInitial(): Promise<void> {
    this.set('loadErrorVisibility', 'collapse');
    this.set('networkBannerVisibility', 'collapse');
    this.set('emptyVisibility', 'collapse');
    this.set('initialLoadingVisibility', 'visible');
    this.clearRows();
    this.nextCursor = undefined;
    this.set('moreVisibility', 'collapse');
    await this.fetchPage();
    this.set('initialLoadingVisibility', 'collapse');
    if (this.get('loadErrorVisibility') === 'visible' || this.get('networkBannerVisibility') === 'visible') {
      return;
    }
    this.set('emptyVisibility', this.eventRows.length === 0 ? 'visible' : 'collapse');
  }

  onLoaded(): void {
    void this.loadInitial();
  }

  onBack(): void {
    authState.navigateToRundown();
  }

  onRetry(): void {
    void this.loadInitial();
  }

  async onLoadMore(): Promise<void> {
    if (this.moreBusy || this.nextCursor == null) {
      return;
    }
    this.moreBusy = true;
    this.set('moreEnabled', false);
    this.set('moreButtonText', 'Cargando…');
    await this.fetchPage(this.nextCursor);
    this.moreBusy = false;
    this.set('moreEnabled', true);
    this.set('moreButtonText', 'Cargar más');
    this.set('emptyVisibility', this.eventRows.length === 0 ? 'visible' : 'collapse');
  }
}

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  page.bindingContext = new HistoryViewModel();
}

export function onLoaded(args: EventData): void {
  const page = args.object as Page;
  (page.bindingContext as HistoryViewModel).onLoaded();
}
