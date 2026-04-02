import { ERROR_CODES, taskFocusedElapsedMs } from '@dayparty/core';
import type { TaskRundownItemResponse } from '@dayparty/api-client';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';
import { todayLocalDateString } from '../utils/today-local';
import styles from './OngoingPage.module.css';

/** Rough focus window per size step (minutes). */
const SIZE_MINUTES = 15;

export function OngoingPage(): ReactElement {
  const { client, onUnauthorized } = useAuth();
  const date = useMemo(() => todayLocalDateString(), []);
  const [focusTask, setFocusTask] = useState<TaskRundownItemResponse | null>(null);
  const [tagColor, setTagColor] = useState<string | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [networkBanner, setNetworkBanner] = useState<string | null>(null);
  const [focusBusy, setFocusBusy] = useState(false);

  const pickFocus = useCallback((tasks: TaskRundownItemResponse[]): TaskRundownItemResponse | null => {
    const open = tasks.filter((t) => !t.isComplete).sort((a, b) => a.position - b.position);
    const inProgress = open.find((t) => t.status === 'in_progress');
    return inProgress ?? open[0] ?? null;
  }, []);

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
    const next = pickFocus(rRes.data.tasks);
    setFocusTask(next);
    if (next?.tagKey) {
      const tag = tRes.data.find((x) => x.key === next.tagKey);
      setTagColor(tag?.color);
    } else {
      setTagColor(undefined);
    }
  }, [client, date, onUnauthorized, pickFocus]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!focusTask) {
      return;
    }
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [focusTask]);

  const targetMinutes = focusTask ? (focusTask.estimatedMinutes ?? focusTask.size * SIZE_MINUTES) : 0;
  const targetMs = Math.max(1, targetMinutes) * 60 * 1000;

  const progress = useMemo(() => {
    if (!focusTask) {
      return 0;
    }
    void tick;
    const elapsed = taskFocusedElapsedMs(focusTask);
    return Math.min(100, (elapsed / targetMs) * 100);
  }, [focusTask, targetMs, tick]);

  const elapsedLabel = useMemo(() => {
    if (!focusTask) {
      return '0:00';
    }
    void tick;
    const secs = Math.floor(taskFocusedElapsedMs(focusTask) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }, [focusTask, tick]);

  async function markComplete(): Promise<void> {
    if (!focusTask) {
      return;
    }
    const result = await client.updateTask(focusTask.id, { isComplete: true });
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

  async function toggleFocusStatus(): Promise<void> {
    if (!focusTask || focusBusy) {
      return;
    }
    if (focusTask.status !== 'planned' && focusTask.status !== 'in_progress') {
      return;
    }
    const nextStatus = focusTask.status === 'in_progress' ? 'planned' : 'in_progress';
    setFocusBusy(true);
    const result = await client.updateTask(focusTask.id, { status: nextStatus });
    setFocusBusy(false);
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

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.back} to="/rundown">
          ← Rundown
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

      {!focusTask && !loadError && !networkBanner ? (
        <p className={styles.celebrate}>You’re all caught up for today.</p>
      ) : null}

      {focusTask ? (
        <section className={styles.card} aria-live="polite">
          <div className={styles.strip} style={{ background: tagColor ?? 'var(--dp-tag-unknown)' }} aria-hidden />
          <div className={styles.inner}>
            <p className={styles.kicker}>Now</p>
            <h1 className={styles.taskTitle}>{focusTask.title}</h1>
            <p className={styles.subRow}>
              <span className={styles.sizeBadge} data-size={focusTask.size}>
                Size {focusTask.size}
              </span>
              {focusTask.tagKey ? <span className={styles.tagKey}>{focusTask.tagKey}</span> : null}
            </p>

            <div className={styles.progressWrap}>
              <div className={styles.progressMeta}>
                <span>Elapsed</span>
                <span>{elapsedLabel}</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <p className={styles.progressHint}>
                Progress is a gentle guide (~{targetMinutes} min target; synced across your devices).
              </p>
            </div>

            {focusTask.status === 'planned' || focusTask.status === 'in_progress' ? (
              <button
                type="button"
                className={styles.focusToggleBtn}
                disabled={focusBusy}
                onClick={() => void toggleFocusStatus()}
              >
                {focusBusy ? 'Updating…' : focusTask.status === 'in_progress' ? 'Pause' : 'Start'}
              </button>
            ) : null}

            <button type="button" className={styles.doneBtn} onClick={() => void markComplete()}>
              Mark complete
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
