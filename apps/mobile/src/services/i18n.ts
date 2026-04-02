import type { UserLocale } from '@dayparty/core';
import { DEFAULT_LOCALE } from '@dayparty/core';
import en from '../i18n/en.json';
import es from '../i18n/es.json';

const tables: Record<UserLocale, Record<string, string>> = {
  en: en as Record<string, string>,
  es: es as Record<string, string>,
};

let current: UserLocale = DEFAULT_LOCALE;

function interpolate(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    const token = `{{${k}}}`;
    out = out.split(token).join(String(v));
  }
  return out;
}

export function setMobileLocale(locale: UserLocale): void {
  current = locale;
}

export function getMobileLocale(): UserLocale {
  return current;
}

/** Mobile i18n lookup (flat keys like `rundown.saveWindow`). */
export function mt(key: string, vars?: Record<string, string | number>): string {
  const raw = tables[current][key] ?? tables.en[key] ?? key;
  return vars ? interpolate(raw, vars) : raw;
}
