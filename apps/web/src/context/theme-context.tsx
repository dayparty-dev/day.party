import type { ColorScheme, UserLocale } from '@dayparty/core';
import { DEFAULT_COLOR_SCHEME, DEFAULT_LOCALE, ERROR_CODES } from '@dayparty/core';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import i18n from '../i18n';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';

function resolveEffectiveScheme(pref: ColorScheme): 'light' | 'dark' {
  if (pref === 'light') {
    return 'light';
  }
  if (pref === 'dark') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyDomScheme(effective: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-color-scheme', effective);
}

type AppearanceContextValue = {
  refreshAppearance: () => Promise<void>;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }): ReactElement {
  const { client, user, authReady, onUnauthorized } = useAuth();
  const prefRef = useRef<ColorScheme>(DEFAULT_COLOR_SCHEME);
  const mediaCleanupRef = useRef<(() => void) | null>(null);

  const clearMediaListener = useCallback(() => {
    mediaCleanupRef.current?.();
    mediaCleanupRef.current = null;
  }, []);

  const applySchemePref = useCallback(
    (pref: ColorScheme) => {
      prefRef.current = pref;
      clearMediaListener();
      const sync = (): void => {
        applyDomScheme(resolveEffectiveScheme(prefRef.current));
      };
      sync();
      if (pref === 'system') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (): void => sync();
        mq.addEventListener('change', onChange);
        mediaCleanupRef.current = () => mq.removeEventListener('change', onChange);
      }
    },
    [clearMediaListener],
  );

  const refreshAppearance = useCallback(async () => {
    if (!user) {
      await i18n.changeLanguage(DEFAULT_LOCALE);
      applySchemePref(DEFAULT_COLOR_SCHEME);
      return;
    }
    const res = await client.getUserPreferences();
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(res.error)) {
        return;
      }
      return;
    }
    const loc = (res.data.locale ?? DEFAULT_LOCALE) as UserLocale;
    const cs = (res.data.colorScheme ?? DEFAULT_COLOR_SCHEME) as ColorScheme;
    await i18n.changeLanguage(loc);
    applySchemePref(cs);
  }, [user, client, onUnauthorized, applySchemePref]);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    void refreshAppearance();
  }, [authReady, user?.id, refreshAppearance]);

  useEffect(() => {
    return () => {
      clearMediaListener();
    };
  }, [clearMediaListener]);

  const value = useMemo(() => ({ refreshAppearance }), [refreshAppearance]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error('useAppearance must be used within AppearanceProvider');
  }
  return ctx;
}
