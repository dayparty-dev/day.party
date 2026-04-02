import { ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { isLikelyNetworkFailure } from '../../utils/network-error';
import styles from './admin-shared.module.css';

export function AdminHomePage(): ReactElement {
  const { client, onUnauthorized } = useAuth();
  const [q, setQ] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ id: string; email: string; displayName?: string; role: string }[]>([]);

  const search = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const res = await client.listUsersAdmin(q);
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
    setItems(res.data.items);
  }, [client, onUnauthorized, q]);

  return (
    <div>
      <h1 className={styles.title}>User search</h1>
      <p className={styles.muted}>Enter at least two characters of an email address.</p>
      <div className={styles.field}>
        <label htmlFor="admin-q">Email contains</label>
        <input
          id="admin-q"
          className={styles.input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="user@example.com"
        />
      </div>
      <button type="button" className={styles.btn} disabled={loading} onClick={() => void search()}>
        {loading ? 'Searching…' : 'Search'}
      </button>
      {err ? (
        <p className={styles.err} role="alert">
          {err}
        </p>
      ) : null}
      <ul className={styles.list}>
        {items.map((u) => (
          <li key={u.id} className={styles.row}>
            <Link to={`/admin/users/${u.id}`}>
              {u.email}
              {u.displayName ? ` · ${u.displayName}` : ''}
            </Link>
            <span className={styles.muted}> · {u.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
