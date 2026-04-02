import type { ColorScheme, UserLocale, VisualPreset } from '@dayparty/core';
import { DEFAULT_COLOR_SCHEME, DEFAULT_LOCALE, ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '../context/theme-context';
import { useVisualPreset } from '../context/visual-preset-context';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';
import styles from './SettingsPage.module.css';

const LOCALES: { value: UserLocale; labelKey: string }[] = [
  { value: 'en', labelKey: 'settings.localeEn' },
  { value: 'es', labelKey: 'settings.localeEs' },
];

const SCHEMES: { value: ColorScheme; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.schemeSystem' },
  { value: 'light', labelKey: 'settings.schemeLight' },
  { value: 'dark', labelKey: 'settings.schemeDark' },
];

const PRESETS: { value: VisualPreset; labelKey: string }[] = [
  { value: 'default', labelKey: 'presets.default' },
  { value: 'calm', labelKey: 'presets.calm' },
  { value: 'playful', labelKey: 'presets.playful' },
  { value: 'highContrast', labelKey: 'presets.highContrast' },
];

export function SettingsPage(): ReactElement {
  const { t } = useTranslation();
  const { client, onUnauthorized } = useAuth();
  const { refreshAppearance } = useAppearance();
  const { refreshVisualPreset, presetError } = useVisualPreset();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [locale, setLocale] = useState<UserLocale>(DEFAULT_LOCALE);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(DEFAULT_COLOR_SCHEME);
  const [visualPreset, setVisualPreset] = useState<VisualPreset>('default');

  const load = useCallback(async () => {
    setLoadErr(null);
    setLoading(true);
    const res = await client.getUserPreferences();
    setLoading(false);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(res.error)) {
        setLoadErr(res.error.message);
        return;
      }
      setLoadErr(res.error.message);
      return;
    }
    setLocale((res.data.locale ?? DEFAULT_LOCALE) as UserLocale);
    setColorScheme((res.data.colorScheme ?? DEFAULT_COLOR_SCHEME) as ColorScheme);
    setVisualPreset(res.data.visualPreset);
  }, [client, onUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(): Promise<void> {
    setSaving(true);
    const res = await client.patchUserPreferences({ locale, colorScheme, visualPreset });
    setSaving(false);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(res.error)) {
        toast.error(res.error.message);
        return;
      }
      toast.error(res.error.message);
      return;
    }
    toast.success(t('settings.savedToast'));
    await refreshAppearance();
    await refreshVisualPreset();
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.back} to="/rundown">
          {t('common.backToRundown')}
        </Link>
        <h1 className={styles.title}>{t('settings.title')}</h1>
        <p className={styles.intro}>{t('settings.intro')}</p>
      </header>

      {loadErr ? <p className={styles.err}>{loadErr}</p> : null}

      {!loading && !loadErr ? (
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="set-locale">
              {t('settings.locale')}
            </label>
            <select
              id="set-locale"
              className={styles.select}
              value={locale}
              onChange={(e) => setLocale(e.target.value as UserLocale)}
            >
              {LOCALES.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="set-scheme">
              {t('settings.appearance')}
            </label>
            <select
              id="set-scheme"
              className={styles.select}
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
            >
              {SCHEMES.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="set-preset">
              {t('settings.visualPreset')}
            </label>
            <select
              id="set-preset"
              className={styles.select}
              value={visualPreset}
              onChange={(e) => setVisualPreset(e.target.value as VisualPreset)}
            >
              {PRESETS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
            <p className={styles.hint}>{t('settings.presetHint')}</p>
            {presetError ? <p className={styles.presetErr}>{presetError}</p> : null}
          </div>

          <button type="button" className={styles.save} disabled={saving} onClick={() => void onSave()}>
            {saving ? t('common.saving') : t('settings.savePrefs')}
          </button>
        </div>
      ) : null}

      {loading ? <p className={styles.hint}>{t('common.loading')}</p> : null}
    </div>
  );
}
