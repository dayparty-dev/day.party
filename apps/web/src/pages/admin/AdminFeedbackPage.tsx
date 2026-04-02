import { ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { AdminFeedbackRow } from '@dayparty/api-client';
import { useAuth } from '../../hooks/useAuth';
import { isLikelyNetworkFailure } from '../../utils/network-error';
import styles from './admin-shared.module.css';

export function AdminFeedbackPage(): ReactElement {
  const { client, onUnauthorized } = useAuth();
  const [rows, setRows] = useState<AdminFeedbackRow[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadInitial = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const res = await client.listAdminFeedback({ limit: 25 });
    setLoading(false);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(res.error)) {
        setErr(res.error.message);
        return;
      }
      setErr(res.error.message);
      return;
    }
    setRows(res.data.items);
    setNext(res.data.nextCursor);
  }, [client, onUnauthorized]);

  const loadMore = useCallback(async () => {
    if (!next) {
      return;
    }
    setErr(null);
    setLoading(true);
    const res = await client.listAdminFeedback({ limit: 25, cursor: next });
    setLoading(false);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(res.error)) {
        setErr(res.error.message);
        return;
      }
      setErr(res.error.message);
      return;
    }
    setRows((r) => [...r, ...res.data.items]);
    setNext(res.data.nextCursor);
  }, [client, next, onUnauthorized]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return (
    <div>
      <h1 className={styles.title}>Feedback</h1>
      {err ? (
        <p className={styles.err} role="alert">
          {err}
        </p>
      ) : null}
      <ul className={styles.list}>
        {rows.map((r) => (
          <li key={r.id} className={styles.row}>
            <div>{r.message}</div>
            <div className={styles.muted}>
              {r.createdAt} · user {r.userId}
              {r.category ? ` · ${r.category}` : ''}
            </div>
          </li>
        ))}
      </ul>
      {next ? (
        <button type="button" className={styles.btn} disabled={loading} onClick={() => void loadMore()}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      ) : null}
    </div>
  );
}
