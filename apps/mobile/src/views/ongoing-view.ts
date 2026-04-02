import type { TaskRundownItemResponse, UpdateTaskInput } from '@dayparty/api-client';
import { taskFocusedElapsedMs } from '@dayparty/core';
import type { EventData, Page } from '@nativescript/core';
import { Observable } from '@nativescript/core';

import { authState } from '../services/auth-state';
import { mt } from '../services/i18n';
import { isLikelyNetworkFailure } from '../utils/network-error';

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

const SIZE_MINUTES = 15;

function openSortedTasks(tasks: TaskRundownItemResponse[]): TaskRundownItemResponse[] {
  return tasks.filter((t) => !t.isComplete).sort((a, b) => a.position - b.position);
}

function pickFocusTask(tasks: TaskRundownItemResponse[]): TaskRundownItemResponse | null {
  const open = openSortedTasks(tasks);
  const inProgress = open.find((t) => t.status === 'in_progress');
  return inProgress ?? open[0] ?? null;
}

function nextTaskAfterFocus(
  focus: TaskRundownItemResponse | null,
  openSorted: TaskRundownItemResponse[],
): TaskRundownItemResponse | null {
  if (!focus) {
    return null;
  }
  const i = openSorted.findIndex((t) => t.id === focus.id);
  if (i < 0) {
    return null;
  }
  return openSorted[i + 1] ?? null;
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
  private currentFocus: TaskRundownItemResponse | null = null;
  private currentTaskId: string | null = null;
  private currentStatus: string | null = null;

  constructor() {
    super();
    this.set('effortMinutes', '');
    this.set('effortSize', '2');
    this.set('effortError', '');
    this.set('effortErrorVisibility', 'collapse');
    this.set('effortSaving', false);
    this.set('effortSaveEnabled', true);
    this.set('effortSaveButtonText', mt('ongoing.saveEffort'));
    this.set('emptyHint', mt('ongoing.caughtUp'));
    this.set('effortTitle', mt('ongoing.plannedEffort'));
    this.set('effortEstHint', mt('ongoing.estHint'));
    this.set('effortSizeHint', mt('ongoing.sizeRange'));
    this.set('nextSectionLabel', mt('ongoing.nextSection'));
    this.set('nextVisibility', 'collapse');
    this.set('nextTitle', '');
    this.set('nextMeta', '');
    this.set('lastOpenVisibility', 'collapse');
    this.set('lastOpenHint', '');
  }

  startTicker(): void {
    this.stopTicker();
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
    const focus = this.currentFocus;
    if (!focus) {
      return;
    }
    const elapsedMs = taskFocusedElapsedMs(focus);
    const secs = Math.floor(elapsedMs / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const targetMin = focus.estimatedMinutes ?? focus.size * SIZE_MINUTES;
    const targetMs = Math.max(1, targetMin) * 60 * 1000;
    const pct = Math.min(100, Math.round((elapsedMs / targetMs) * 100));
    this.set('elapsedLabel', mt('ongoing.elapsed', { m, s: String(s).padStart(2, '0') }));
    this.set('progressValue', pct);
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
      this.set('errorMessage', net ? mt('ongoing.network') : rundownResult.error.message);
      this.set('errorBannerVisibility', 'visible');
      this.set('emptyVisibility', 'collapse');
      this.set('focusVisibility', 'collapse');
      this.set('nextVisibility', 'collapse');
      this.set('lastOpenVisibility', 'collapse');
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

    const open = openSortedTasks(rundownResult.data.tasks);
    const focus = pickFocusTask(rundownResult.data.tasks);
    if (!focus) {
      this.stopTicker();
      this.currentFocus = null;
      this.currentTaskId = null;
      this.currentStatus = null;
      this.set('emptyVisibility', 'visible');
      this.set('focusVisibility', 'collapse');
      this.set('focusToggleVisibility', 'collapse');
      this.set('nextVisibility', 'collapse');
      this.set('lastOpenVisibility', 'collapse');
      return;
    }

    this.currentTaskId = focus.id;
    this.currentStatus = focus.status;
    this.currentFocus = focus;
    this.set('emptyVisibility', 'collapse');
    this.set('focusVisibility', 'visible');
    const canFocus = focus.status === 'planned' || focus.status === 'in_progress';
    this.set('focusToggleVisibility', canFocus ? 'visible' : 'collapse');
    this.set('focusToggleText', focus.status === 'in_progress' ? mt('ongoing.pause') : mt('ongoing.focus'));
    this.set('title', focus.title);
    const tag = focus.tagKey != null && tagNames.has(focus.tagKey) ? tagNames.get(focus.tagKey) : mt('ongoing.noTag');
    this.set('metaLine', mt('ongoing.metaSize', { size: focus.size, tag: tag ?? '' }));
    this.set('effortMinutes', focus.estimatedMinutes != null ? String(focus.estimatedMinutes) : '');
    this.set('effortSize', String(focus.size));
    this.set('effortError', '');
    this.set('effortErrorVisibility', 'collapse');

    const next = nextTaskAfterFocus(focus, open);
    if (next) {
      const nextTag =
        next.tagKey != null && tagNames.has(next.tagKey) ? tagNames.get(next.tagKey) : mt('ongoing.noTag');
      const approx = next.estimatedMinutes ?? next.size * SIZE_MINUTES;
      this.set('nextVisibility', 'visible');
      this.set('nextTitle', next.title);
      this.set('nextMeta', mt('ongoing.nextMeta', { min: approx, size: next.size, tag: nextTag ?? '' }));
      this.set('lastOpenVisibility', 'collapse');
    } else {
      this.set('nextVisibility', 'collapse');
      this.set('nextTitle', '');
      this.set('nextMeta', '');
      this.set('lastOpenVisibility', 'visible');
      this.set('lastOpenHint', mt('ongoing.lastHint'));
    }

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
      this.set('errorMessage', net ? mt('ongoing.network') : result.error.message);
      this.set('errorBannerVisibility', 'visible');
      return;
    }
    await this.loadFocus();
  }

  onRetry(): void {
    void this.loadFocus();
  }

  async onSaveEffort(): Promise<void> {
    if (!this.currentTaskId || !this.currentFocus) {
      return;
    }
    if (this.get('effortSaving')) {
      return;
    }
    this.set('effortError', '');
    this.set('effortErrorVisibility', 'collapse');
    const trimmed = String(this.get('effortMinutes') ?? '').trim();
    let estimatedMinutes: number | undefined;
    if (trimmed !== '') {
      const n = Number(trimmed);
      if (!Number.isInteger(n) || n < 0 || n > 2880) {
        this.set('effortError', mt('ongoing.badMinutesNoEmpty'));
        this.set('effortErrorVisibility', 'visible');
        return;
      }
      estimatedMinutes = n;
    }
    const sizeNum = Number(String(this.get('effortSize') ?? '').trim());
    if (!Number.isInteger(sizeNum) || sizeNum < 1 || sizeNum > 5) {
      this.set('effortError', mt('ongoing.badSize'));
      this.set('effortErrorVisibility', 'visible');
      return;
    }
    const focus = this.currentFocus;
    const sizeChanged = sizeNum !== focus.size;
    const minutesChanged = trimmed !== '' && estimatedMinutes !== focus.estimatedMinutes;
    if (!sizeChanged && !minutesChanged) {
      return;
    }
    const patch: UpdateTaskInput = { size: sizeNum as 1 | 2 | 3 | 4 | 5 };
    if (trimmed !== '') {
      patch.estimatedMinutes = estimatedMinutes;
    }
    this.set('effortSaving', true);
    this.set('effortSaveEnabled', false);
    this.set('effortSaveButtonText', mt('ongoing.savingEffort'));
    const client = authState.getClient();
    try {
      const result = await client.updateTask(this.currentTaskId, patch);
      if (authState.consumeUnauthorized(result)) {
        return;
      }
      if (result.ok === false) {
        const net = isLikelyNetworkFailure(result.error);
        this.set('effortError', net ? mt('network.offlineShort') : result.error.message);
        this.set('effortErrorVisibility', 'visible');
        return;
      }
      await this.loadFocus();
    } finally {
      this.set('effortSaving', false);
      this.set('effortSaveEnabled', true);
      this.set('effortSaveButtonText', mt('ongoing.saveEffort'));
    }
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
      this.set('errorMessage', net ? mt('ongoing.network') : result.error.message);
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
