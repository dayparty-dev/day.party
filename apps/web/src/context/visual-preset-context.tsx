import { ERROR_CODES, type VisualPreset } from '@dayparty/core';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';

const NON_DEFAULT_PRESETS = new Set<VisualPreset>(['calm', 'playful', 'highContrast']);

function syncDocumentPreset(preset: VisualPreset): void {
  const root = document.documentElement;
  root.classList.remove('preset-calm', 'preset-playful', 'preset-highContrast');
  if (NON_DEFAULT_PRESETS.has(preset)) {
    root.classList.add(`preset-${preset}`);
  }
}

type VisualPresetContextValue = {
  visualPreset: VisualPreset | null;
  presetError: string | null;
  savingPreset: boolean;
  /** Load from server and apply to `document.documentElement`. */
  refreshVisualPreset: () => Promise<void>;
  /** PATCH `visualPreset` then update DOM. Returns false on failure. */
  saveVisualPreset: (next: VisualPreset) => Promise<boolean>;
};

const VisualPresetContext = createContext<VisualPresetContextValue | null>(null);

export function VisualPresetProvider({ children }: { children: ReactNode }): ReactElement {
  const { client, onUnauthorized } = useAuth();
  const [visualPreset, setVisualPreset] = useState<VisualPreset | null>(null);
  const [presetError, setPresetError] = useState<string | null>(null);
  const [savingPreset, setSavingPreset] = useState(false);

  const refreshVisualPreset = useCallback(async () => {
    setPresetError(null);
    const res = await client.getUserPreferences();
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(res.error)) {
        setPresetError(res.error.message);
        return;
      }
      setPresetError(res.error.message);
      return;
    }
    setVisualPreset(res.data.visualPreset);
    syncDocumentPreset(res.data.visualPreset);
  }, [client, onUnauthorized]);

  useEffect(() => {
    void refreshVisualPreset();
  }, [refreshVisualPreset]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('preset-calm', 'preset-playful', 'preset-highContrast');
    };
  }, []);

  const saveVisualPreset = useCallback(
    async (next: VisualPreset): Promise<boolean> => {
      setPresetError(null);
      setSavingPreset(true);
      const res = await client.patchUserPreferences({ visualPreset: next });
      setSavingPreset(false);
      if (!res.ok) {
        if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
          onUnauthorized();
          return false;
        }
        if (isLikelyNetworkFailure(res.error)) {
          setPresetError(res.error.message);
          return false;
        }
        setPresetError(res.error.message);
        return false;
      }
      setVisualPreset(res.data.visualPreset);
      syncDocumentPreset(res.data.visualPreset);
      return true;
    },
    [client, onUnauthorized],
  );

  const value = useMemo(
    () => ({
      visualPreset,
      presetError,
      savingPreset,
      refreshVisualPreset,
      saveVisualPreset,
    }),
    [visualPreset, presetError, savingPreset, refreshVisualPreset, saveVisualPreset],
  );

  return <VisualPresetContext.Provider value={value}>{children}</VisualPresetContext.Provider>;
}

export function useVisualPreset(): VisualPresetContextValue {
  const ctx = useContext(VisualPresetContext);
  if (!ctx) {
    throw new Error('useVisualPreset must be used within VisualPresetProvider');
  }
  return ctx;
}
