import type { TaskRundownItemResponse } from '@dayparty/api-client';
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

function pickFocusTask(tasks: TaskRundownItemResponse[]): TaskRundownItemResponse | null {
  const open = tasks.filter((t) => !t.isComplete).sort((a, b) => a.position - b.position);
  const inProgress = open.find((t) => t.status === 'in_progress');
  return inProgress ?? open[0] ?? null;
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
  focusToggleVisibility = 'collapse';
  focusToggleText = '';
  focusToggleEnabled = true;
  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private focusStartedAt = 0;
  private currentTaskId: string | null = null;
  private currentStatus: string | null = null;

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

    const focus = pickFocusTask(rundownResult.data.tasks);
    if (!focus) {
      this.stopTicker();
      this.currentTaskId = null;
      this.currentStatus = null;
      this.set('emptyVisibility', 'visible');
      this.set('focusVisibility', 'collapse');
      this.set('focusToggleVisibility', 'collapse');
      return;
    }

    this.currentTaskId = focus.id;
    this.currentStatus = focus.status;
    this.set('emptyVisibility', 'collapse');
    this.set('focusVisibility', 'visible');
    const canFocus = focus.status === 'planned' || focus.status === 'in_progress';
    this.set('focusToggleVisibility', canFocus ? 'visible' : 'collapse');
    this.set('focusToggleText', focus.status === 'in_progress' ? 'Pausa' : 'Enfoque');
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

  async onToggleFocus(): Promise<void> {
    if (!this.currentTaskId || !this.currentStatus) {
      return;
    }
    if (this.currentStatus !== 'planned' && this.currentStatus !== 'in_progress') {
      return;
    }
    const next = this.currentStatus === 'in_progress' ? 'planned' : 'in_progress';
    this.set('focusToggleEnabled', false);
    const client = authState.getClient();
    const result = await client.updateTask(this.currentTaskId, { status: next });
    this.set('focusToggleEnabled', true);
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
