import type { DayPartyClient } from '@dayparty/api-client';
import { DEFAULT_VISUAL_PRESET, ERROR_CODES, type VisualPreset } from '@dayparty/core';
import { Frame, type Page } from '@nativescript/core';

const PRESET_CLASSES = ['preset-calm', 'preset-playful', 'preset-highContrast'] as const;

let cachedPreset: VisualPreset = DEFAULT_VISUAL_PRESET;

export function getCachedVisualPreset(): VisualPreset {
  return cachedPreset;
}

export function resetVisualPresetCache(): void {
  cachedPreset = DEFAULT_VISUAL_PRESET;
  const page = Frame.topmost()?.currentPage;
  if (page) {
    applyVisualPresetToPage(page);
  }
}

function stripPresetClasses(className: string): string {
  const parts = className.split(/\s+/).filter(Boolean);
  const drop = new Set<string>(PRESET_CLASSES);
  return parts
    .filter((c) => !drop.has(c))
    .join(' ')
    .trim();
}

/** Syncs {@link Page} `className` with {@link cachedPreset} (non-default → `preset-<name>`). */
export function applyVisualPresetToPage(page: Page): void {
  const base = stripPresetClasses(page.className ?? '');
  const suffix = cachedPreset !== 'default' ? ` preset-${cachedPreset}` : '';
  page.className = `${base}${suffix}`.replace(/\s+/g, ' ').trim();
}

/**
 * Loads `visualPreset` from the API and applies it to the current page when present.
 */
export async function refreshVisualPresetFromApi(client: DayPartyClient, onUnauthorized?: () => void): Promise<void> {
  const res = await client.getUserPreferences();
  if (res.ok === false) {
    if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
      onUnauthorized?.();
    }
    return;
  }
  cachedPreset = res.data.visualPreset;
  const page = Frame.topmost()?.currentPage;
  if (page) {
    applyVisualPresetToPage(page);
  }
}
