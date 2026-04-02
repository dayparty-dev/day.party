import type { EventData, Page } from '@nativescript/core';
import type { ItemEventData } from '@nativescript/core/ui';
import { Observable, ObservableArray } from '@nativescript/core';

import { authState } from '../services/auth-state';
import { isLikelyNetworkFailure } from '../utils/network-error';

type TaskRow = {
  id: string;
  title: string;
  size: string;
  tagColor: string;
  completeIcon: string;
  isComplete: boolean;
  metaLine: string;
  runwayLabel: string;
};

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function formatMinuteOfDay(m: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.round(m)));
  const h = Math.floor(clamped / 60);
  const min = clamped % 60;
  return `${h}:${String(min).padStart(2, '0')}`;
}

class RundownViewModel extends Observable {
  taskRows = new ObservableArray<TaskRow>();
  summaryText = '';
  planFootnote = '';
  errorMessage = '';
  errorBannerVisibility = 'collapse';

  constructor() {
    super();
  }

  async loadRundown(): Promise<void> {
    this.set('errorBannerVisibility', 'collapse');
    const client = authState.getClient();
    const date = todayIso();
    const rundownResult = await client.getRundown(date);
    if (authState.consumeUnauthorized(rundownResult)) {
      return;
    }
    if (rundownResult.ok === false) {
      const net = isLikelyNetworkFailure(rundownResult.error);
      this.set(
        'errorMessage',
        net
          ? 'No se pudo contactar al servidor. Comprueba la red o que la API esté en marcha.'
          : rundownResult.error.message,
      );
      this.set('errorBannerVisibility', 'visible');
      return;
    }

    const tagsResult = await client.getTags();
    if (authState.consumeUnauthorized(tagsResult)) {
      return;
    }
    const tagColors = new Map<string, string>();
    if (tagsResult.ok) {
      for (const tag of tagsResult.data) {
        tagColors.set(tag.key, tag.color ?? '#6b7280');
      }
    }

    const { capacity, completed, tasks, dayFit, dayWindow } = rundownResult.data;
    this.set('summaryText', `${completed}/${capacity} completadas · ${date}`);

    const start = formatMinuteOfDay(dayWindow.startMinuteOfDay);
    const end = formatMinuteOfDay(dayWindow.endMinuteOfDay);
    const cross = dayWindow.crossesMidnight ? ' · cruza medianoche' : '';
    const over = dayFit.overflowUnresolved ? ' · Esencial fuera de ventana' : '';
    this.set(
      'planFootnote',
      `Ventana ${start}–${end}${cross} · ${dayFit.plannedMinutes}/${dayFit.availableMinutes} min previstos${over}`,
    );

    while (this.taskRows.length > 0) {
      this.taskRows.pop();
    }
    const sorted = [...tasks].sort((a, b) => a.position - b.position);
    for (const t of sorted) {
      const parts: string[] = [];
      if (t.estimatedMinutes != null) {
        parts.push(`${t.estimatedMinutes} min`);
      }
      parts.push(`tam. ${t.size}`);
      if (t.essentiality === 'essential') {
        parts.push('Esencial');
      }
      if (t.essentiality === 'optional') {
        parts.push('Opcional');
      }
      let runwayLabel = '';
      if (!t.isComplete) {
        runwayLabel = dayFit.outsideRunwayTaskIds.includes(t.id) ? 'Extra' : 'En ventana';
      }
      this.taskRows.push({
        id: t.id,
        title: t.title,
        size: String(t.size),
        tagColor: t.tagKey ? (tagColors.get(t.tagKey) ?? '#6b7280') : '#9ca3af',
        completeIcon: t.isComplete ? '✓' : '○',
        isComplete: t.isComplete,
        metaLine: parts.join(' · '),
        runwayLabel,
      });
    }
  }

  onLoaded(): void {
    void this.loadRundown();
  }

  onTaskTap(args: ItemEventData): void {
    void this.toggleAt(args.index);
  }

  async toggleAt(index: number): Promise<void> {
    const row = this.taskRows.getItem(index);
    if (!row) {
      return;
    }
    const client = authState.getClient();
    const result = await client.updateTask(row.id, { isComplete: !row.isComplete });
    if (authState.consumeUnauthorized(result)) {
      return;
    }
    if (result.ok === false) {
      const net = isLikelyNetworkFailure(result.error);
      this.set(
        'errorMessage',
        net ? 'No se pudo contactar al servidor. Comprueba la red o que la API esté en marcha.' : result.error.message,
      );
      this.set('errorBannerVisibility', 'visible');
      return;
    }
    await this.loadRundown();
  }

  onOngoing(): void {
    authState.navigateToOngoing();
  }

  async onLogout(): Promise<void> {
    await authState.logout();
  }

  onRetry(): void {
    void this.loadRundown();
  }
}

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  page.bindingContext = new RundownViewModel();
}

export function onLoaded(args: EventData): void {
  const page = args.object as Page;
  const vm = page.bindingContext as RundownViewModel;
  vm.onLoaded();
}
