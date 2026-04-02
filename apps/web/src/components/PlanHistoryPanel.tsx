import type { ApiPlanHistoryEvent, DayPartyClient } from '@dayparty/api-client';
import { ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isLikelyNetworkFailure } from '../utils/network-error';
import styles from './PlanHistoryPanel.module.css';

export type PlanHistoryPanelProps = {
  client: DayPartyClient;
  onUnauthorized: () => void;
  onNetworkError?: (msg: string) => void;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function formatType(type: string): string {
  return type.replace(/\./g, ' · ');
}

function payloadPreview(payload: Record<string, unknown>): string {
  try {
    const s = JSON.stringify(payload);
    return s.length > 200 ? `${s.slice(0, 200)}…` : s;
  } catch {
    return '…';
  }
}

function EventRow({ e }: { e: ApiPlanHistoryEvent }): ReactElement {
  return (
    <li className={styles.li}>
      <div className={styles.when}>{formatWhen(e.timestamp)}</div>
      <div className={styles.type}>{formatType(e.type)}</div>
      <div className={styles.entity}>{e.entityId}</div>
      <pre className={styles.payload}>{payloadPreview(e.payload)}</pre>
    </li>
  );
}

export function PlanHistoryPanel({ client, onUnauthorized, onNetworkError }: PlanHistoryPanelProps): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<ApiPlanHistoryEvent[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadPage = useCallback(
    async (nextCursor?: string) => {
      const res = await client.getHistory({
        limit: 25,
        ...(nextCursor ? { cursor: nextCursor } : {}),
        order: 'desc',
      });
      if (!res.ok) {
        if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
          onUnauthorized();
          return null;
        }
        if (isLikelyNetworkFailure(res.error)) {
          onNetworkError?.(res.error.message);
          return null;
        }
        return { err: res.error.message as string };
      }
      return { data: res.data };
    },
    [client, onNetworkError, onUnauthorized],
  );

  useEffect(() => {
    if (!open || initialLoaded) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const result = await loadPage();
      if (cancelled) {
        return;
      }
      setLoading(false);
      setInitialLoaded(true);
      if (!result) {
        return;
      }
      if ('err' in result) {
        setError(typeof result.err === 'string' ? result.err : t('common.requestFailed'));
        return;
      }
      setEvents(result.data.events);
      setCursor(result.data.nextCursor ?? undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, initialLoaded, loadPage]);

  async function loadMore(): Promise<void> {
    if (!cursor) {
      return;
    }
    setMoreLoading(true);
    setError(null);
    const result = await loadPage(cursor);
    setMoreLoading(false);
    if (!result) {
      return;
    }
    if ('err' in result) {
      setError(typeof result.err === 'string' ? result.err : t('common.requestFailed'));
      return;
    }
    setEvents((prev) => [...prev, ...result.data.events]);
    setCursor(result.data.nextCursor ?? undefined);
  }

  return (
    <details
      className={styles.details}
      open={open}
      onToggle={(ev) => {
        const el = ev.currentTarget;
        setOpen(el.open);
        if (!el.open) {
          setInitialLoaded(false);
          setEvents([]);
          setCursor(undefined);
          setError(null);
        }
      }}
    >
      <summary className={styles.summary}>{t('planHistory.title')}</summary>
      <div className={styles.body}>
        <p className={styles.hint}>{t('planHistory.hint')}</p>
        {error ? <p className={styles.err}>{error}</p> : null}
        {loading ? <p className={styles.empty}>{t('common.loading')}</p> : null}
        {!loading && open && initialLoaded && events.length === 0 && !error ? (
          <p className={styles.empty}>{t('planHistory.noEvents')}</p>
        ) : null}
        {events.length > 0 ? (
          <ul className={styles.list}>
            {events.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </ul>
        ) : null}
        {cursor ? (
          <button type="button" className={styles.moreBtn} disabled={moreLoading} onClick={() => void loadMore()}>
            {moreLoading ? t('common.loading') : t('planHistory.loadMore')}
          </button>
        ) : null}
      </div>
    </details>
  );
}
