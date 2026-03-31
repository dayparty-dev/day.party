import type { EventData, Page } from '@nativescript/core';
import { Observable } from '@nativescript/core';

import { authState } from '../services/auth-state';
import { isLikelyNetworkFailure } from '../utils/network-error';

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

type RundownTask = {
  id: string;
  title: string;
  size: 1 | 2 | 3 | 4 | 5;
  tagKey?: string;
  isComplete: boolean;
  position: number;
};

function pickFocusTask(tasks: RundownTask[]): RundownTask | null {
  const sorted = [...tasks].sort((a, b) => a.position - b.position);
  return sorted.find((t) => !t.isComplete) ?? null;
}

class OngoingViewModel extends Observable {
  title = '';
  metaLine = '';
  elapsedLabel = '';
  progressValue = 0;
  errorMessage = '';
  errorBannerVisibility = 'collapse';
  emptyVisibility = 'collapse';
  focusVisibility = 'collapse';
  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private focusStartedAt = 0;
  private currentTaskId: string | null = null;

  startTicker(): void {
    this.stopTicker();
    this.focusStartedAt = Date.now();
    this.tickHandle = setInterval(() => this.updateElapsed(), 1000);
    this.updateElapsed();
  }

  stopTicker(): void {
    if (this.tickHandle !== null) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  private updateElapsed(): void {
    const secs = Math.floor((Date.now() - this.focusStartedAt) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    this.set('elapsedLabel', `Tiempo en esta tarea: ${m}m ${String(s).padStart(2, '0')}s`);
  }

  async loadFocus(): Promise<void> {
    this.set('errorBannerVisibility', 'collapse');
    const client = authState.getClient();
    const rundownResult = await client.getRundown(todayIso());
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
      this.set('emptyVisibility', 'collapse');
      this.set('focusVisibility', 'collapse');
      return;
    }

    const tagsResult = await client.getTags();
    if (authState.consumeUnauthorized(tagsResult)) {
      return;
    }
    const tagNames = new Map<string, string>();
    if (tagsResult.ok) {
      for (const tag of tagsResult.data) {
        tagNames.set(tag.key, tag.displayName);
      }
    }

    const focus = pickFocusTask(rundownResult.data.tasks as RundownTask[]);
    if (!focus) {
      this.stopTicker();
      this.currentTaskId = null;
      this.set('emptyVisibility', 'visible');
      this.set('focusVisibility', 'collapse');
      return;
    }

    this.currentTaskId = focus.id;
    this.set('emptyVisibility', 'collapse');
    this.set('focusVisibility', 'visible');
    this.set('title', focus.title);
    const tag = focus.tagKey != null && tagNames.has(focus.tagKey) ? tagNames.get(focus.tagKey) : 'Sin etiqueta';
    this.set('metaLine', `Tamaño ${focus.size} · ${tag}`);
    const pct = Math.min(100, Math.round((focus.size / 5) * 100));
    this.set('progressValue', pct);
    this.startTicker();
  }

  onLoaded(): void {
    void this.loadFocus();
  }

  onUnloaded(): void {
    this.stopTicker();
  }

  onBack(): void {
    authState.navigateToRundown();
  }

  async onComplete(): Promise<void> {
    if (!this.currentTaskId) {
      return;
    }
    const client = authState.getClient();
    const result = await client.updateTask(this.currentTaskId, { isComplete: true });
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
    await this.loadFocus();
  }

  onRetry(): void {
    void this.loadFocus();
  }
}

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  page.bindingContext = new OngoingViewModel();
}

export function onLoaded(args: EventData): void {
  const page = args.object as Page;
  (page.bindingContext as OngoingViewModel).onLoaded();
}

export function onUnloaded(args: EventData): void {
  const page = args.object as Page;
  (page.bindingContext as OngoingViewModel).onUnloaded();
}
