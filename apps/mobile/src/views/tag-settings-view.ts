import type { TagResponse } from '@dayparty/api-client';
import type { EventData, Page } from '@nativescript/core';
import { Observable, ObservableArray } from '@nativescript/core';
import { action, confirm, prompt } from '@nativescript/core/ui/dialogs';

import { authState } from '../services/auth-state';
import { isLikelyNetworkFailure } from '../utils/network-error';

type TagRow = {
  lineTitle: string;
  lineMeta: string;
  stripColor: string;
  onEditTap: () => void;
  onDeleteTap: () => void;
};

class TagSettingsViewModel extends Observable {
  tagRows = new ObservableArray<TagRow>();
  private tags: TagResponse[] = [];

  constructor() {
    super();
    this.set('networkBanner', '');
    this.set('networkBannerVisibility', 'collapse');
    this.set('formError', '');
    this.set('newTagKey', '');
    this.set('newTagName', '');
    this.set('newTagColor', '#5b8cff');
    this.set('createSaving', false);
    this.set('createEnabled', true);
    this.set('createButtonText', 'Crear etiqueta');
  }

  onBack(): void {
    authState.navigateToRundown();
  }

  onRetry(): void {
    void this.reload();
  }

  private rebuildRows(): void {
    while (this.tagRows.length > 0) {
      this.tagRows.pop();
    }
    for (const t of this.tags) {
      const tag = t;
      this.tagRows.push({
        lineTitle: tag.displayName,
        lineMeta: `${tag.key} · ${tag.color ?? 'sin color'}`,
        stripColor: tag.color ?? '#999999',
        onEditTap: () => {
          void this.editTag(tag);
        },
        onDeleteTap: () => {
          void this.deleteTag(tag);
        },
      });
    }
  }

  async reload(): Promise<void> {
    this.set('networkBannerVisibility', 'collapse');
    const client = authState.getClient();
    const res = await client.getTags();
    if (authState.consumeUnauthorized(res)) {
      return;
    }
    if (res.ok === false) {
      const err = res.error;
      this.set('networkBanner', isLikelyNetworkFailure(err) ? err.message : err.message);
      this.set('networkBannerVisibility', 'visible');
      return;
    }
    this.tags = res.data;
    this.rebuildRows();
  }

  async onLoaded(): Promise<void> {
    await this.reload();
  }

  async onCreateTag(): Promise<void> {
    this.set('formError', '');
    const key = String(this.get('newTagKey') ?? '')
      .trim()
      .toLowerCase();
    const displayName = String(this.get('newTagName') ?? '').trim();
    const colorRaw = String(this.get('newTagColor') ?? '').trim();
    if (!key || !/^[a-z0-9-]+$/.test(key)) {
      this.set('formError', 'Clave: minúsculas, números y guiones.');
      return;
    }
    if (!displayName) {
      this.set('formError', 'Nombre para mostrar obligatorio.');
      return;
    }
    let color: string | undefined;
    if (colorRaw !== '') {
      if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(colorRaw)) {
        this.set('formError', 'Color: #RGB o #RRGGBB.');
        return;
      }
      color = colorRaw;
    }
    this.set('createSaving', true);
    this.set('createEnabled', false);
    this.set('createButtonText', 'Guardando…');
    const client = authState.getClient();
    const result = await client.createTag({ key, displayName, color });
    this.set('createSaving', false);
    this.set('createEnabled', true);
    this.set('createButtonText', 'Crear etiqueta');
    if (authState.consumeUnauthorized(result)) {
      return;
    }
    if (result.ok === false) {
      this.set('formError', result.error.message);
      return;
    }
    this.set('newTagKey', '');
    this.set('newTagName', '');
    this.set('newTagColor', '#5b8cff');
    await this.reload();
  }

  private async editTag(tag: TagResponse): Promise<void> {
    const nameRes = await prompt({
      title: 'Nombre',
      message: 'Nuevo nombre visible',
      defaultText: tag.displayName,
      okButtonText: 'OK',
      cancelButtonText: 'Cancelar',
    });
    if (!nameRes.result) {
      return;
    }
    const displayName = nameRes.text.trim();
    if (!displayName) {
      return;
    }
    const colRes = await prompt({
      title: 'Color',
      message: 'Hex (#RRGGBB) o vacío para quitar',
      defaultText: tag.color ?? '',
      okButtonText: 'OK',
      cancelButtonText: 'Cancelar',
    });
    if (!colRes.result) {
      return;
    }
    const c = colRes.text.trim();
    const patch: { displayName: string; color?: string | null } = { displayName };
    if (c === '') {
      patch.color = null;
    } else if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c)) {
      patch.color = c;
    } else {
      await confirm({
        title: 'Color inválido',
        message: 'Usa #RGB o #RRGGBB.',
        okButtonText: 'OK',
      });
      return;
    }
    const client = authState.getClient();
    const result = await client.updateTag(tag.id, patch);
    if (authState.consumeUnauthorized(result)) {
      return;
    }
    if (result.ok === false) {
      this.set('formError', result.error.message);
      return;
    }
    await this.reload();
  }

  private async deleteTag(tag: TagResponse): Promise<void> {
    const others = this.tags.filter((t) => t.id !== tag.id);
    let replacementTagId: string | null = null;

    if (others.length > 0) {
      const actions = ['Quitar de tareas (sin reasignar)', ...others.map((o) => `Reasignar → ${o.displayName}`)];
      const choice = await action({
        title: `Eliminar “${tag.displayName}”`,
        message: 'Las tareas pueden quedar sin esta etiqueta o moverse a otra.',
        cancelButtonText: 'Cancelar',
        actions,
      });
      if (choice === 'Cancelar') {
        return;
      }
      if (choice === 'Quitar de tareas (sin reasignar)') {
        replacementTagId = null;
      } else {
        const prefix = 'Reasignar → ';
        const name = choice.startsWith(prefix) ? choice.slice(prefix.length) : '';
        const repl = others.find((o) => o.displayName === name);
        if (!repl) {
          return;
        }
        replacementTagId = repl.id;
      }
    } else {
      const ok = await confirm({
        title: 'Eliminar etiqueta',
        message: `¿Eliminar “${tag.displayName}”?`,
        okButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
      });
      if (!ok) {
        return;
      }
    }

    const client = authState.getClient();
    const result = await client.deleteTagWithPolicy(tag.id, { replacementTagId });
    if (authState.consumeUnauthorized(result)) {
      return;
    }
    if (result.ok === false) {
      this.set('formError', result.error.message);
      return;
    }
    this.set('formError', '');
    await this.reload();
  }
}

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  page.bindingContext = new TagSettingsViewModel();
}

export function onLoaded(args: EventData): void {
  const page = args.object as Page;
  void (page.bindingContext as TagSettingsViewModel).onLoaded();
}
