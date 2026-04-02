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

/** `HH:MM` for TextField (leading zero on hour). */
function formatMinuteOfDayForInput(m: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.round(m)));
  const h = Math.floor(clamped / 60);
  const min = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function parseTimeInput(value: string): number | null {
  const v = value.trim();
  const parts = v.split(':');
  if (parts.length < 2) {
    return null;
  }
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return null;
  }
  return Math.max(0, Math.min(1439, h * 60 + m));
}

class RundownViewModel extends Observable {
  taskRows = new ObservableArray<TaskRow>();
  summaryText = '';
  planFootnote = '';
  errorMessage = '';
  errorBannerVisibility = 'collapse';

  constructor() {
    super();
    this.set('windowStartInput', '09:00');
    this.set('windowEndInput', '17:00');
    this.set('windowCrosses', false);
    this.set('windowEditorVisibility', 'collapse');
    this.set('windowSaveError', '');
    this.set('windowSaving', false);
    this.set('saveWindowEnabled', true);
    this.set('saveButtonText', 'Guardar ventana');
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

    this.set('windowStartInput', formatMinuteOfDayForInput(dayWindow.startMinuteOfDay));
    this.set('windowEndInput', formatMinuteOfDayForInput(dayWindow.endMinuteOfDay));
    this.set('windowCrosses', dayWindow.crossesMidnight);

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

  onToggleWindowEditor(): void {
    const next = this.get('windowEditorVisibility') === 'visible' ? 'collapse' : 'visible';
    this.set('windowEditorVisibility', next);
    if (next === 'visible') {
      this.set('windowSaveError', '');
    }
  }

  onWindowCrossChange(args: EventData): void {
    const sw = args.object as unknown as { checked: boolean };
    this.set('windowCrosses', sw.checked);
  }

  async onSaveWindow(): Promise<void> {
    this.set('windowSaveError', '');
    const startMin = parseTimeInput(String(this.get('windowStartInput') ?? ''));
    const endMin = parseTimeInput(String(this.get('windowEndInput') ?? ''));
    const crosses = Boolean(this.get('windowCrosses'));
    if (startMin === null || endMin === null) {
      this.set('windowSaveError', 'Formato inválido. Usa HH:MM en 24h (ej. 09:00).');
      return;
    }
    if (!crosses && startMin >= endMin) {
      this.set('windowSaveError', 'Si no cruza medianoche, el inicio debe ser antes del fin.');
      return;
    }
    if (crosses && startMin <= endMin) {
      this.set('windowSaveError', 'Si cruza medianoche, el inicio (tarde) debe ser después del fin (mañana).');
      return;
    }

    this.set('windowSaving', true);
    this.set('saveWindowEnabled', false);
    this.set('saveButtonText', 'Guardando…');
    const client = authState.getClient();
    const res = await client.patchUserPreferences({
      dayWindow: {
        startMinuteOfDay: startMin,
        endMinuteOfDay: endMin,
        crossesMidnight: crosses,
      },
    });
    this.set('windowSaving', false);
    this.set('saveWindowEnabled', true);
    this.set('saveButtonText', 'Guardar ventana');

    if (authState.consumeUnauthorized(res)) {
      return;
    }
    if (res.ok === false) {
      const net = isLikelyNetworkFailure(res.error);
      this.set('windowSaveError', net ? 'Sin conexión. Revisa la red o la API.' : res.error.message);
      return;
    }

    this.set('windowEditorVisibility', 'collapse');
    await this.loadRundown();
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
