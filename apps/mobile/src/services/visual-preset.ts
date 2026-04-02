import type { DayPartyClient } from '@dayparty/api-client';
import {
  DEFAULT_COLOR_SCHEME,
  DEFAULT_LOCALE,
  DEFAULT_VISUAL_PRESET,
  ERROR_CODES,
  type ColorScheme,
  type UserLocale,
  type VisualPreset,
} from '@dayparty/core';
import { Application, Frame, type Page } from '@nativescript/core';

import { setMobileLocale } from './i18n';

const PRESET_CLASSES = ['preset-calm', 'preset-playful', 'preset-highContrast'] as const;

let cachedPreset: VisualPreset = DEFAULT_VISUAL_PRESET;
let cachedScheme: ColorScheme = DEFAULT_COLOR_SCHEME;

export function getCachedVisualPreset(): VisualPreset {
  return cachedPreset;
}

export function getCachedColorScheme(): ColorScheme {
  return cachedScheme;
}

export function resetVisualPresetCache(): void {
  cachedPreset = DEFAULT_VISUAL_PRESET;
  cachedScheme = DEFAULT_COLOR_SCHEME;
  setMobileLocale(DEFAULT_LOCALE);
  const page = Frame.topmost()?.currentPage;
  if (page) {
    applyAppearanceToPage(page);
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

function stripDarkClass(className: string): string {
  return className
    .split(/\s+/)
    .filter((c) => c && c !== 'ns-dark')
    .join(' ')
    .trim();
}

function effectiveDark(scheme: ColorScheme): boolean {
  if (scheme === 'dark') {
    return true;
  }
  if (scheme === 'light') {
    return false;
  }
  return Application.systemAppearance() === 'dark';
}

/**
 * Applies {@link cachedPreset} (gamification look) and {@link cachedScheme} (`ns-dark` when effective theme is dark).
 */
export function applyAppearanceToPage(page: Page): void {
  let base = page.className ?? '';
  base = stripDarkClass(base);
  base = stripPresetClasses(base);
  const presetSuffix = cachedPreset !== 'default' ? ` preset-${cachedPreset}` : '';
  const darkSuffix = effectiveDark(cachedScheme) ? ' ns-dark' : '';
  page.className = `${base}${presetSuffix}${darkSuffix}`.replace(/\s+/g, ' ').trim();
}

/** @deprecated Use {@link applyAppearanceToPage} */
export function applyVisualPresetToPage(page: Page): void {
  applyAppearanceToPage(page);
}

/**
 * Loads preferences from the API and applies visual preset, color scheme, and in-app locale.
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
  cachedScheme = (res.data.colorScheme ?? DEFAULT_COLOR_SCHEME) as ColorScheme;
  setMobileLocale((res.data.locale ?? DEFAULT_LOCALE) as UserLocale);
  const page = Frame.topmost()?.currentPage;
  if (page) {
    applyAppearanceToPage(page);
  }
}
