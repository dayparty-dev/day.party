import type { EventData, NavigatedData, Page, PropertyChangeData } from '@nativescript/core';
import { Frame, Observable, ObservableArray } from '@nativescript/core';

import type { TagResponse, UpdateTaskInput } from '@dayparty/api-client';
import type { ApiError } from '@dayparty/core';
import type { TaskEssentiality, TaskStatus } from '@dayparty/core';

import { authState } from '../services/auth-state';
import { isLikelyNetworkFailure } from '../utils/network-error';

const STATUS_ORDER: TaskStatus[] = ['planned', 'in_progress', 'deferred', 'skipped', 'done'];

const ESS_ORDER: TaskEssentiality[] = ['essential', 'normal', 'optional'];

function parseBountyTagKeys(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

class TaskDetailViewModel extends Observable {
  private readonly taskId: string;
  private tagKeysList: string[] = [''];

  constructor(taskId: string, notesFocus: boolean) {
    super();
    this.taskId = taskId;
    this.set('pageTitle', notesFocus ? 'Notas' : 'Editar tarea');
    this.set('notesEditorHeight', notesFocus ? 220 : 150);
    this.set('title', '');
    this.set('sizeText', '2');
    this.set('minutesText', '');
    this.set('essentialityIndex', 1);
    this.set('tagPickerIndex', 0);
    this.set('scheduledDate', '');
    this.set('statusIndex', 0);
    this.set('deferredToDate', '');
    this.set('notesMarkdown', '');
    this.set('bountyAmountText', '');
    this.set('bountyTagKeysText', '');
    this.set('bountyHighResistance', false);
    this.set('clearBounty', false);
    this.set('hadBounty', false);
    this.set('errorMessage', '');
    this.set('errorBannerVisibility', 'collapse');
    this.set('formError', '');
    this.set('loadingVisibility', 'visible');
    this.set('formVisibility', 'collapse');
    this.set('saveEnabled', true);
    this.set('saveButtonText', 'Guardar');
    this.set('deferredVisibility', 'collapse');
    this.set('hadBountyVisibility', 'collapse');

    const statusOptions = new ObservableArray<string>();
    statusOptions.push('Planificada', 'En curso', 'Aplazada', 'Omitida hoy', 'Hecha');
    this.set('statusOptions', statusOptions);
    const essentialityOptions = new ObservableArray<string>();
    essentialityOptions.push('Esencial', 'Normal', 'Opcional');
    this.set('essentialityOptions', essentialityOptions);
    this.set('tagItems', new ObservableArray<string>('(ninguna)'));

    this.on(Observable.propertyChangeEvent, (ev: PropertyChangeData) => {
      if (ev.propertyName === 'statusIndex') {
        this.updateDeferredVisibility();
      }
    });
  }

  onBack(): void {
    Frame.topmost()?.goBack();
  }

  private updateDeferredVisibility(): void {
    const idx = Number(this.get('statusIndex'));
    this.set('deferredVisibility', idx === 2 ? 'visible' : 'collapse');
  }

  onRetry(): void {
    void this.load();
  }

  private hydrateFromTask(task: {
    title: string;
    size: number;
    estimatedMinutes?: number;
    essentiality?: TaskEssentiality;
    tagKey?: string;
    scheduledDate: string;
    status: TaskStatus;
    deferredToDate?: string;
    notesMarkdown?: string;
    bounty?: { amount: number; tagKeys?: string[]; highResistance?: boolean };
  }): void {
    this.set('title', task.title);
    this.set('sizeText', String(task.size));
    this.set('minutesText', task.estimatedMinutes != null ? String(task.estimatedMinutes) : '');
    const ess = task.essentiality ?? 'normal';
    const essIdx = ESS_ORDER.indexOf(ess);
    this.set('essentialityIndex', essIdx >= 0 ? essIdx : 1);
    this.set('scheduledDate', task.scheduledDate);
    const stIdx = STATUS_ORDER.indexOf(task.status);
    this.set('statusIndex', stIdx >= 0 ? stIdx : 0);
    this.set('deferredToDate', task.deferredToDate ?? '');
    this.set('notesMarkdown', task.notesMarkdown ?? '');
    this.updateDeferredVisibility();

    const key = task.tagKey ?? '';
    const tIdx = this.tagKeysList.indexOf(key);
    this.set('tagPickerIndex', tIdx >= 0 ? tIdx : 0);

    if (task.bounty && task.bounty.amount > 0) {
      this.set('hadBounty', true);
      this.set('hadBountyVisibility', 'visible');
      this.set('bountyAmountText', String(task.bounty.amount));
      this.set('bountyTagKeysText', (task.bounty.tagKeys ?? []).join(', '));
      this.set('bountyHighResistance', Boolean(task.bounty.highResistance));
    } else {
      this.set('hadBounty', false);
      this.set('hadBountyVisibility', 'collapse');
      this.set('bountyAmountText', '');
      this.set('bountyTagKeysText', '');
      this.set('bountyHighResistance', false);
    }
    this.set('clearBounty', false);
  }

  private buildTagPicker(tags: TagResponse[]): void {
    this.tagKeysList = [''];
    const items = new ObservableArray<string>('(ninguna)');
    for (const t of tags) {
      this.tagKeysList.push(t.key);
      items.push(t.displayName);
    }
    this.set('tagItems', items);
  }

  async load(): Promise<void> {
    this.set('errorBannerVisibility', 'collapse');
    this.set('formError', '');
    this.set('loadingVisibility', 'visible');
    this.set('formVisibility', 'collapse');

    if (!this.taskId) {
      this.set('errorMessage', 'No se pudo abrir la tarea.');
      this.set('errorBannerVisibility', 'visible');
      this.set('loadingVisibility', 'collapse');
      return;
    }

    const client = authState.getClient();
    const [taskRes, tagsRes] = await Promise.all([client.getTask(this.taskId), client.getTags()]);

    if (authState.consumeUnauthorized(taskRes)) {
      return;
    }
    if (taskRes.ok === false) {
      this.showLoadError(taskRes.error);
      return;
    }

    if (authState.consumeUnauthorized(tagsRes)) {
      return;
    }
    const tags = tagsRes.ok ? tagsRes.data : [];
    this.buildTagPicker(tags);
    this.hydrateFromTask(taskRes.data);
    this.set('loadingVisibility', 'collapse');
    this.set('formVisibility', 'visible');
  }

  private showLoadError(error: ApiError): void {
    const net = isLikelyNetworkFailure(error);
    this.set(
      'errorMessage',
      net ? 'No se pudo contactar al servidor. Comprueba la red o que la API esté en marcha.' : error.message,
    );
    this.set('errorBannerVisibility', 'visible');
    this.set('loadingVisibility', 'collapse');
    this.set('formVisibility', 'collapse');
  }

  async onSave(): Promise<void> {
    this.set('formError', '');
    const title = String(this.get('title') ?? '').trim();
    if (!title) {
      this.set('formError', 'El título es obligatorio.');
      return;
    }

    const statusIdx = Number(this.get('statusIndex'));
    const status = STATUS_ORDER[statusIdx] ?? 'planned';
    let deferredToDate = String(this.get('deferredToDate') ?? '').trim();
    if (status === 'deferred') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(deferredToDate)) {
        this.set('formError', 'Indica una fecha AAAA-MM-DD para tareas aplazadas.');
        return;
      }
    } else {
      deferredToDate = '';
    }

    const sizeNum = Number(String(this.get('sizeText') ?? '').trim());
    if (!Number.isInteger(sizeNum) || sizeNum < 1 || sizeNum > 5) {
      this.set('formError', 'El tamaño debe ser un entero entre 1 y 5.');
      return;
    }

    let estimatedMinutes: number | undefined;
    const minutesStr = String(this.get('minutesText') ?? '').trim();
    if (minutesStr !== '') {
      const m = Number(minutesStr);
      if (!Number.isInteger(m) || m < 0 || m > 2880) {
        this.set('formError', 'Los minutos deben ser un entero entre 0 y 2880.');
        return;
      }
      estimatedMinutes = m;
    }

    const essIdx = Number(this.get('essentialityIndex'));
    const essentiality = ESS_ORDER[essIdx] ?? 'normal';

    const tagIdx = Number(this.get('tagPickerIndex'));
    const tagKeyRaw = this.tagKeysList[tagIdx] ?? '';
    const tagKey = tagKeyRaw === '' ? null : tagKeyRaw;

    const scheduledDate = String(this.get('scheduledDate') ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
      this.set('formError', 'La fecha planificada debe ser AAAA-MM-DD.');
      return;
    }

    const clearBounty = Boolean(this.get('clearBounty'));
    let bountyPatch: UpdateTaskInput['bounty'];
    if (clearBounty) {
      bountyPatch = null;
    } else {
      const bRaw = String(this.get('bountyAmountText') ?? '').trim();
      if (bRaw !== '') {
        const amt = Number(bRaw);
        if (!Number.isInteger(amt) || amt < 1 || amt > 1_000_000) {
          this.set('formError', 'La recompensa debe ser un entero entre 1 y 1.000.000.');
          return;
        }
        const tagKeys = parseBountyTagKeys(String(this.get('bountyTagKeysText') ?? ''));
        bountyPatch = {
          amount: amt,
          ...(tagKeys.length > 0 ? { tagKeys } : {}),
          ...(this.get('bountyHighResistance') ? { highResistance: true } : {}),
        };
      }
    }

    const patch: UpdateTaskInput = {
      title,
      size: sizeNum as 1 | 2 | 3 | 4 | 5,
      scheduledDate,
      essentiality,
      status,
      tagKey,
      ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
      ...(status === 'deferred' && deferredToDate ? { deferredToDate } : {}),
      ...(bountyPatch !== undefined ? { bounty: bountyPatch } : {}),
    };

    const notesRaw = String(this.get('notesMarkdown') ?? '');
    patch.notesMarkdown = notesRaw;

    this.set('saveEnabled', false);
    this.set('saveButtonText', 'Guardando…');
    const client = authState.getClient();
    const res = await client.updateTask(this.taskId, patch);
    this.set('saveEnabled', true);
    this.set('saveButtonText', 'Guardar');

    if (authState.consumeUnauthorized(res)) {
      return;
    }
    if (res.ok === false) {
      const net = isLikelyNetworkFailure(res.error);
      this.set('formError', net ? 'Sin conexión. Revisa la red o la API.' : res.error.message);
      return;
    }

    this.hydrateFromTask(res.data);
    this.set('formError', '');
    Frame.topmost()?.goBack();
  }

  onLoaded(): void {
    void this.load();
  }
}

export function onNavigatingTo(args: NavigatedData): void {
  const page = args.object as Page;
  const ctx = (args.context ?? page.navigationContext) as { taskId?: string; notesFocus?: boolean } | undefined;
  const taskId = typeof ctx?.taskId === 'string' ? ctx.taskId : '';
  const notesFocus = ctx?.notesFocus === true;
  page.bindingContext = new TaskDetailViewModel(taskId, notesFocus);
}

export function onLoaded(args: EventData): void {
  const page = args.object as Page;
  const vm = page.bindingContext as TaskDetailViewModel;
  if (!vm) {
    return;
  }
  vm.onLoaded();
}
