import { ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import type { TaskResponse } from '@dayparty/api-client';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { isLikelyNetworkFailure } from '../../utils/network-error';
import { todayLocalDateString } from '../../utils/today-local';
import styles from './admin-shared.module.css';

export function AdminUserDetailPage(): ReactElement {
  const { t } = useTranslation();
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
      <h1 className={styles.title}>{email || t('admin.userFallback')}</h1>
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
        {t('admin.reloadTasks')}
      </button>
      <ul className={styles.list}>
        {tasks.map((task) => (
          <li key={task.id} className={styles.row}>
            <strong>{task.title}</strong>
            <span className={styles.muted}>
              {' '}
              · {task.id} · {task.scheduledDate}
            </span>
            {patchId === task.id ? (
              <div className={styles.field}>
                <input className={styles.input} value={patchTitle} onChange={(e) => setPatchTitle(e.target.value)} />
                <button type="button" className={styles.btn} onClick={() => void applyPatch(task.id)}>
                  {t('admin.saveTitle')}
                </button>
                <button type="button" className={styles.btn} onClick={() => setPatchId(null)}>
                  {t('admin.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.btn}
                onClick={() => {
                  setPatchId(task.id);
                  setPatchTitle(task.title);
                }}
              >
                {t('admin.editTitle')}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
