import { ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import type { TaskResponse } from '@dayparty/api-client';
import { useAuth } from '../../hooks/useAuth';
import { isLikelyNetworkFailure } from '../../utils/network-error';
import { todayLocalDateString } from '../../utils/today-local';
import styles from './admin-shared.module.css';

export function AdminUserDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const { client, onUnauthorized } = useAuth();
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(todayLocalDateString());
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [patchId, setPatchId] = useState<string | null>(null);
  const [patchTitle, setPatchTitle] = useState('');

  const loadUser = useCallback(async () => {
    if (!id) {
      return;
    }
    setErr(null);
    const res = await client.getUserAdmin(id);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      setErr(res.error.message);
      return;
    }
    setEmail(res.data.email);
  }, [client, id, onUnauthorized]);

  const loadTasks = useCallback(async () => {
    if (!id) {
      return;
    }
    setErr(null);
    const res = await client.listTasksAdmin({ userId: id, date });
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      setErr(res.error.message);
      return;
    }
    setTasks(res.data.items);
  }, [client, date, id, onUnauthorized]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function applyPatch(taskId: string): Promise<void> {
    setErr(null);
    const res = await client.patchTaskAdmin(taskId, { title: patchTitle.trim() });
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
    setPatchId(null);
    setPatchTitle('');
    await loadTasks();
  }

  return (
    <div>
      <h1 className={styles.title}>{email || 'User'}</h1>
      {err ? (
        <p className={styles.err} role="alert">
          {err}
        </p>
      ) : null}
      <div className={styles.field}>
        <label htmlFor="admin-date">Task date (YYYY-MM-DD)</label>
        <input id="admin-date" className={styles.input} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button type="button" className={styles.btn} onClick={() => void loadTasks()}>
        Reload tasks
      </button>
      <ul className={styles.list}>
        {tasks.map((t) => (
          <li key={t.id} className={styles.row}>
            <strong>{t.title}</strong>
            <span className={styles.muted}>
              {' '}
              · {t.id} · {t.scheduledDate}
            </span>
            {patchId === t.id ? (
              <div className={styles.field}>
                <input className={styles.input} value={patchTitle} onChange={(e) => setPatchTitle(e.target.value)} />
                <button type="button" className={styles.btn} onClick={() => void applyPatch(t.id)}>
                  Save title
                </button>
                <button type="button" className={styles.btn} onClick={() => setPatchId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.btn}
                onClick={() => {
                  setPatchId(t.id);
                  setPatchTitle(t.title);
                }}
              >
                Edit title
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
