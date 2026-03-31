import { ERROR_CODES } from '@dayparty/core';
import type { TagResponse, TaskResponse } from '@dayparty/api-client';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { TaskCard } from '../components/TaskCard';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';
import { todayLocalDateString } from '../utils/today-local';
import styles from './RundownPage.module.css';

export function RundownPage(): ReactElement {
  const { client, onUnauthorized } = useAuth();
  const date = useMemo(() => todayLocalDateString(), []);
  const [rundown, setRundown] = useState<{
    tasks: TaskResponse[];
    capacity: number;
    completed: number;
  } | null>(null);
  const [tags, setTags] = useState<TagResponse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [networkBanner, setNetworkBanner] = useState<string | null>(null);

  const tagColorByKey = useMemo(() => {
    const m = new Map<string, string>();
    if (!tags) {
      return m;
    }
    for (const t of tags) {
      if (t.color) {
        m.set(t.key, t.color);
      }
    }
    return m;
  }, [tags]);

  const load = useCallback(async () => {
    setLoadError(null);
    setNetworkBanner(null);
    const [rRes, tRes] = await Promise.all([client.getRundown(date), client.getTags()]);
    if (!rRes.ok) {
      if (rRes.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(rRes.error)) {
        setNetworkBanner(rRes.error.message);
        return;
      }
      setLoadError(rRes.error.message);
      return;
    }
    if (!tRes.ok) {
      if (tRes.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(tRes.error)) {
        setNetworkBanner(tRes.error.message);
        return;
      }
      setLoadError(tRes.error.message);
      return;
    }
    setRundown({
      tasks: rRes.data.tasks,
      capacity: rRes.data.capacity,
      completed: rRes.data.completed,
    });
    setTags(tRes.data);
  }, [client, date, onUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleTask(task: TaskResponse): Promise<void> {
    const result = await client.updateTask(task.id, { isComplete: !task.isComplete });
    if (!result.ok) {
      if (result.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(result.error)) {
        setNetworkBanner(result.error.message);
        return;
      }
      setLoadError(result.error.message);
      return;
    }
    await load();
  }

  const sortedTasks = useMemo(() => {
    if (!rundown) {
      return [];
    }
    return [...rundown.tasks].sort((a, b) => a.position - b.position);
  }, [rundown]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Today</h1>
          <p className={styles.meta}>
            {date}
            {rundown ? (
              <>
                {' · '}
                {rundown.completed}/{rundown.capacity} done
              </>
            ) : null}
          </p>
        </div>
        <Link className={styles.ongoingBtn} to="/ongoing">
          Ongoing
        </Link>
      </header>

      {networkBanner ? (
        <div className={styles.banner} role="status">
          <p className={styles.bannerText}>Network error: {networkBanner}</p>
          <button type="button" className={styles.retry} onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      {loadError ? <p className={styles.err}>{loadError}</p> : null}

      <ul className={styles.list}>
        {sortedTasks.map((task) => (
          <li key={task.id} className={styles.li}>
            <TaskCard
              task={task}
              tagColor={task.tagKey ? tagColorByKey.get(task.tagKey) : undefined}
              onToggleComplete={toggleTask}
            />
          </li>
        ))}
      </ul>

      {rundown && sortedTasks.length === 0 ? <p className={styles.empty}>No tasks for this day yet.</p> : null}
    </div>
  );
}
