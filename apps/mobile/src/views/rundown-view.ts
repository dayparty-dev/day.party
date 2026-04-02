import type {
  CreateTaskInput,
  DayCapacityHint,
  DayRundownResponse,
  TaskRundownItemResponse,
  TaskTriageInput,
} from '@dayparty/api-client';
import type { EventData, Page } from '@nativescript/core';
import { Observable, ObservableArray } from '@nativescript/core';

import { authState } from '../services/auth-state';
import { isLikelyNetworkFailure } from '../utils/network-error';

type TaskRow = {
  id: string;
  scheduledDate: string;
  title: string;
  size: string;
  tagColor: string;
  completeIcon: string;
  isComplete: boolean;
  metaLine: string;
  notesPreviewLine: string;
  notesPreviewVisibility: 'visible' | 'collapse';
  runwayLabel: string;
  focusBtnText: string;
  focusBtnVisibility: 'visible' | 'collapse';
  triageVisibility: 'visible' | 'collapse';
  canDemote: boolean;
  deferTomorrowEnabled: boolean;
  demoteEnabled: boolean;
  skipTriageEnabled: boolean;
  skipBtnText: string;
  moveDateInput: string;
  moveHint: string;
  moveEnabled: boolean;
  onToggleComplete: () => void;
  onEditTap: () => void;
  onNotesTap: () => void;
  onFocusTap: () => void;
  onDeferTomorrow: () => void;
  onDemote: () => void;
  onSkipTriage: () => void;
  onMoveToDate: () => void;
  onMoveDateTextChange: (args: EventData) => void;
  reorderMoveUpEnabled: boolean;
  reorderMoveDownEnabled: boolean;
  onReorderUp: () => void;
  onReorderDown: () => void;
  reorderBarVisibility: 'visible' | 'collapse';
};

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function addLocalCalendarDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, '0');
  const da = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mo}-${da}`;
}

function isValidLocalIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return false;
  }
  const [y, m, d] = s.split('-').map(Number);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return false;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }
  const dt = new Date(y!, m! - 1, d!);
  return dt.getFullYear() === y && dt.getMonth() === m! - 1 && dt.getDate() === d!;
}

function showTriageForTask(task: TaskRundownItemResponse, dayFit: DayRundownResponse['dayFit']): boolean {
  if (task.isComplete) {
    return false;
  }
  if (task.status === 'skipped') {
    return true;
  }
  return dayFit.overflowUnresolved || dayFit.outsideRunwayTaskIds.includes(task.id);
}

function hintLabelForDate(hints: DayCapacityHint[], date: string): string {
  const h = hints.find((x) => x.date === date);
  return h != null ? `≈ ${h.remainingMinutes} min libres` : '';
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

function arrayMoveIds(ids: string[], from: number, to: number): string[] {
  const next = [...ids];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x!);
  return next;
}

function parseBountyTagKeys(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

class RundownViewModel extends Observable {
  taskRows = new ObservableArray<TaskRow>();
  summaryText = '';
  planFootnote = '';
  errorMessage = '';
  errorBannerVisibility = 'collapse';

  private capacityHints: DayCapacityHint[] = [];
  private tomorrowDateStr = '';
  private reorderBusy = false;

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
    this.set('newTaskTitle', '');
    this.set('newTaskSize', '2');
    this.set('newTaskMinutes', '');
    this.set('taskEssential', false);
    this.set('taskOptional', false);
    this.set('newTaskBountyAmount', '');
    this.set('newTaskBountyTagKeys', '');
    this.set('newTaskBountyHighResistance', false);
    this.set('createTaskError', '');
    this.set('createTaskSaving', false);
    this.set('createTaskEnabled', true);
    this.set('createTaskButtonText', 'Añadir tarea');
    this.set('planningDate', todayIso());
    this.set('dateTodayBtnVisibility', 'collapse');
  }

  private getEffectivePlanningDate(): string {
    const raw = String(this.get('planningDate') ?? '').trim();
    return isValidLocalIsoDate(raw) ? raw : todayIso();
  }

  onDatePrev(): void {
    const d = this.getEffectivePlanningDate();
    this.set('planningDate', addLocalCalendarDays(d, -1));
    void this.loadRundown();
  }

  onDateNext(): void {
    const d = this.getEffectivePlanningDate();
    this.set('planningDate', addLocalCalendarDays(d, 1));
    void this.loadRundown();
  }

  onDateToday(): void {
    this.set('planningDate', todayIso());
    void this.loadRundown();
  }

  onPlanningDateTextChange(args: EventData): void {
    const tf = args.object as { text?: string };
    const text = String(tf.text ?? '').trim();
    if (text.length === 10 && isValidLocalIsoDate(text)) {
      this.set('planningDate', text);
      void this.loadRundown();
    }
  }

  async loadRundown(): Promise<void> {
    this.set('errorBannerVisibility', 'collapse');
    const client = authState.getClient();
    const date = this.getEffectivePlanningDate();
    this.set('planningDate', date);
    this.set('dateTodayBtnVisibility', date !== todayIso() ? 'visible' : 'collapse');
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
    this.tomorrowDateStr = addLocalCalendarDays(date, 1);

    const sug = await client.getDaySuggestions({ fromDate: date, toDate: addLocalCalendarDays(date, 7) });
    if (authState.consumeUnauthorized(sug)) {
      return;
    }
    this.capacityHints = sug.ok ? sug.data.hints : [];

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
    const tomorrow = this.tomorrowDateStr;
    const reorderBarVisibility: 'visible' | 'collapse' = sorted.length >= 2 ? 'visible' : 'collapse';
    for (let i = 0; i < sorted.length; i++) {
      const t = sorted[i]!;
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
      if (t.status === 'skipped') {
        parts.push('Omitida hoy');
      }
      if (t.status === 'in_progress') {
        parts.push('En curso');
      }
      let runwayLabel = '';
      if (!t.isComplete) {
        runwayLabel = dayFit.outsideRunwayTaskIds.includes(t.id) ? 'Extra' : 'En ventana';
      }
      const canFocus = !t.isComplete && (t.status === 'planned' || t.status === 'in_progress');
      const taskId = t.id;
      const status = t.status;
      const scheduledDate = t.scheduledDate ?? date;
      const showTriage = showTriageForTask(t, dayFit);
      const moveDateInput = tomorrow;
      const moveHint = hintLabelForDate(this.capacityHints, moveDateInput);
      const canDemote = t.essentiality !== 'optional';
      const rowIndex = i;
      const taskIdForReorder = taskId;
      const preview = (t.notesPreview ?? '').trim();
      this.taskRows.push({
        id: taskId,
        scheduledDate,
        title: t.title,
        size: String(t.size),
        tagColor: t.tagKey ? (tagColors.get(t.tagKey) ?? '#6b7280') : '#9ca3af',
        completeIcon: t.isComplete ? '✓' : '○',
        isComplete: t.isComplete,
        metaLine: parts.join(' · '),
        notesPreviewLine: preview,
        notesPreviewVisibility: preview.length > 0 ? 'visible' : 'collapse',
        runwayLabel,
        focusBtnText: t.status === 'in_progress' ? 'Pausa' : 'Enfoque',
        focusBtnVisibility: canFocus ? 'visible' : 'collapse',
        triageVisibility: showTriage ? 'visible' : 'collapse',
        canDemote,
        deferTomorrowEnabled: tomorrow !== scheduledDate,
        demoteEnabled: canDemote,
        skipTriageEnabled: true,
        skipBtnText: t.status === 'skipped' ? 'Deshacer omisión' : 'Omitir hoy',
        moveDateInput,
        moveHint,
        moveEnabled: isValidLocalIsoDate(moveDateInput) && moveDateInput !== scheduledDate,
        onToggleComplete: () => void this.toggleAt(rowIndex),
        onEditTap: () => authState.navigateToTaskDetail(taskId),
        onNotesTap: () => authState.navigateToTaskDetail(taskId, { notesFocus: true }),
        onFocusTap: () => void this.toggleFocusFor(taskId, status),
        onDeferTomorrow: () => void this.runTriageFor(taskId, { action: 'defer_to_date', targetDate: tomorrow }),
        onDemote: () => void this.runTriageFor(taskId, { action: 'demote' }),
        onSkipTriage: () =>
          void this.runTriageFor(taskId, {
            action: t.status === 'skipped' ? 'clear_skipped' : 'mark_skipped',
          }),
        onMoveToDate: () => {
          const row = this.taskRows.getItem(rowIndex);
          if (!row || !isValidLocalIsoDate(row.moveDateInput)) {
            return;
          }
          void this.runTriageFor(taskId, { action: 'defer_to_date', targetDate: row.moveDateInput });
        },
        onMoveDateTextChange: (args: EventData) => {
          this.handleMoveDateTextChange(rowIndex, args);
        },
        reorderMoveUpEnabled: i > 0 && !this.reorderBusy,
        reorderMoveDownEnabled: i < sorted.length - 1 && !this.reorderBusy,
        onReorderUp: () => void this.moveOrderedTask(taskIdForReorder, -1),
        onReorderDown: () => void this.moveOrderedTask(taskIdForReorder, 1),
        reorderBarVisibility,
      });
    }
  }

  private handleMoveDateTextChange(index: number, args: EventData): void {
    const tf = args.object as { text?: string };
    const text = String(tf.text ?? '').trim();
    const cur = this.taskRows.getItem(index);
    if (!cur) {
      return;
    }
    const moveHint = hintLabelForDate(this.capacityHints, text);
    const moveEnabled = isValidLocalIsoDate(text) && text !== cur.scheduledDate;
    this.taskRows.setItem(index, {
      ...cur,
      moveDateInput: text,
      moveHint,
      moveEnabled,
    });
  }

  private updateReorderRowStates(): void {
    const n = this.taskRows.length;
    for (let j = 0; j < n; j++) {
      const r = this.taskRows.getItem(j);
      if (!r) {
        continue;
      }
      this.taskRows.setItem(j, {
        ...r,
        reorderMoveUpEnabled: j > 0 && !this.reorderBusy,
        reorderMoveDownEnabled: j < n - 1 && !this.reorderBusy,
      });
    }
  }

  private async moveOrderedTask(taskId: string, delta: number): Promise<void> {
    if (this.reorderBusy) {
      return;
    }
    const n = this.taskRows.length;
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      ids.push(this.taskRows.getItem(i)!.id);
    }
    const idx = ids.indexOf(taskId);
    const newIdx = idx + delta;
    if (idx < 0 || newIdx < 0 || newIdx >= n) {
      return;
    }
    const nextIds = arrayMoveIds(ids, idx, newIdx);
    this.reorderBusy = true;
    this.updateReorderRowStates();
    const client = authState.getClient();
    const date = this.getEffectivePlanningDate();
    const res = await client.reorderTasks({ date, taskIds: nextIds });
    this.reorderBusy = false;
    this.updateReorderRowStates();
    if (authState.consumeUnauthorized(res)) {
      return;
    }
    if (res.ok === false) {
      const net = isLikelyNetworkFailure(res.error);
      this.set(
        'errorMessage',
        net ? 'No se pudo contactar al servidor. Comprueba la red o que la API esté en marcha.' : res.error.message,
      );
      this.set('errorBannerVisibility', 'visible');
      return;
    }
    await this.loadRundown();
  }

  private refreshTriageBusy(busyTaskId: string | null): void {
    for (let j = 0; j < this.taskRows.length; j++) {
      const r = this.taskRows.getItem(j);
      if (!r) {
        continue;
      }
      const idle = busyTaskId == null || busyTaskId !== r.id;
      const moveEnabled = idle && isValidLocalIsoDate(r.moveDateInput) && r.moveDateInput !== r.scheduledDate;
      this.taskRows.setItem(j, {
        ...r,
        deferTomorrowEnabled: idle && this.tomorrowDateStr !== r.scheduledDate,
        demoteEnabled: idle && r.canDemote,
        skipTriageEnabled: idle,
        moveEnabled,
      });
    }
  }

  private async runTriageFor(taskId: string, body: TaskTriageInput): Promise<void> {
    this.refreshTriageBusy(taskId);
    try {
      const client = authState.getClient();
      const result = await client.triageTask(taskId, body);
      if (authState.consumeUnauthorized(result)) {
        return;
      }
      if (result.ok === false) {
        const net = isLikelyNetworkFailure(result.error);
        this.set(
          'errorMessage',
          net
            ? 'No se pudo contactar al servidor. Comprueba la red o que la API esté en marcha.'
            : result.error.message,
        );
        this.set('errorBannerVisibility', 'visible');
        return;
      }
      await this.loadRundown();
    } finally {
      this.refreshTriageBusy(null);
    }
  }

  onLoaded(): void {
    void this.loadRundown();
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

  async toggleFocusFor(taskId: string, status: string): Promise<void> {
    if (status !== 'planned' && status !== 'in_progress') {
      return;
    }
    const next = status === 'in_progress' ? 'planned' : 'in_progress';
    const client = authState.getClient();
    const result = await client.updateTask(taskId, { status: next });
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

  onRewards(): void {
    authState.navigateToRewards();
  }

  onHistory(): void {
    authState.navigateToHistory();
  }

  onTags(): void {
    authState.navigateToTagSettings();
  }

  onFeedback(): void {
    authState.navigateToFeedback();
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

  onEssentialChange(args: EventData): void {
    const sw = args.object as unknown as { checked: boolean };
    if (sw.checked) {
      this.set('taskOptional', false);
    }
    this.set('taskEssential', sw.checked);
  }

  onOptionalChange(args: EventData): void {
    const sw = args.object as unknown as { checked: boolean };
    if (sw.checked) {
      this.set('taskEssential', false);
    }
    this.set('taskOptional', sw.checked);
  }

  async onCreateTask(): Promise<void> {
    this.set('createTaskError', '');
    const title = String(this.get('newTaskTitle') ?? '').trim();
    if (!title) {
      this.set('createTaskError', 'Escribe un título.');
      return;
    }
    const sizeNum = Number(String(this.get('newTaskSize') ?? '2').trim());
    if (!Number.isInteger(sizeNum) || sizeNum < 1 || sizeNum > 5) {
      this.set('createTaskError', 'El tamaño debe ser un entero entre 1 y 5.');
      return;
    }
    const minutesStr = String(this.get('newTaskMinutes') ?? '').trim();
    let estimatedMinutes: number | undefined;
    if (minutesStr !== '') {
      const m = Number(minutesStr);
      if (!Number.isInteger(m) || m < 0 || m > 2880) {
        this.set('createTaskError', 'Los minutos deben ser un entero entre 0 y 2880.');
        return;
      }
      estimatedMinutes = m;
    }
    const essential = Boolean(this.get('taskEssential'));
    const optional = Boolean(this.get('taskOptional'));
    let essentiality: 'essential' | 'optional' | undefined;
    if (essential) {
      essentiality = 'essential';
    } else if (optional) {
      essentiality = 'optional';
    }

    let bounty: CreateTaskInput['bounty'];
    const bRaw = String(this.get('newTaskBountyAmount') ?? '').trim();
    if (bRaw !== '') {
      const amt = Number(bRaw);
      if (!Number.isInteger(amt) || amt < 1 || amt > 1_000_000) {
        this.set('createTaskError', 'La recompensa debe ser un entero entre 1 y 1.000.000.');
        return;
      }
      const tagKeys = parseBountyTagKeys(String(this.get('newTaskBountyTagKeys') ?? ''));
      bounty = {
        amount: amt,
        ...(tagKeys.length > 0 ? { tagKeys } : {}),
        ...(Boolean(this.get('newTaskBountyHighResistance')) ? { highResistance: true } : {}),
      };
    }

    const client = authState.getClient();
    const date = this.getEffectivePlanningDate();
    const body: CreateTaskInput = {
      title,
      size: sizeNum as 1 | 2 | 3 | 4 | 5,
      scheduledDate: date,
      ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
      ...(essentiality ? { essentiality } : {}),
      ...(bounty !== undefined ? { bounty } : {}),
    };

    this.set('createTaskSaving', true);
    this.set('createTaskEnabled', false);
    this.set('createTaskButtonText', 'Añadiendo…');
    const result = await client.createTask(body);
    this.set('createTaskSaving', false);
    this.set('createTaskEnabled', true);
    this.set('createTaskButtonText', 'Añadir tarea');

    if (authState.consumeUnauthorized(result)) {
      return;
    }
    if (result.ok === false) {
      const net = isLikelyNetworkFailure(result.error);
      this.set('createTaskError', net ? 'Sin conexión. Revisa la red o la API.' : result.error.message);
      return;
    }
    this.set('newTaskTitle', '');
    this.set('newTaskMinutes', '');
    this.set('newTaskBountyAmount', '');
    this.set('newTaskBountyTagKeys', '');
    this.set('newTaskBountyHighResistance', false);
    await this.loadRundown();
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
