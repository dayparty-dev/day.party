import type { TaskRundownItemResponse, UpdateTaskInput } from '@dayparty/api-client';
import { ERROR_CODES, taskFocusedElapsedMs } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { FocusPiPControl, isDocumentPiPSupported } from '../components/FocusPiP';
import { nextTaskAfterFocus, openSortedTasks, pickFocusTask } from '../utils/ongoing-focus';
import { isLikelyNetworkFailure } from '../utils/network-error';
import { todayLocalDateString } from '../utils/today-local';
import styles from './OngoingPage.module.css';

/** Rough focus window per size step (minutes). */
const SIZE_MINUTES = 15;

const SIZES = [1, 2, 3, 4, 5] as const;

export function OngoingPage(): ReactElement {
  const { t } = useTranslation();
  const { client, onUnauthorized } = useAuth();
  const date = useMemo(() => todayLocalDateString(), []);
  const [focusTask, setFocusTask] = useState<TaskRundownItemResponse | null>(null);
  const [nextTask, setNextTask] = useState<TaskRundownItemResponse | null>(null);
  const [tagColor, setTagColor] = useState<string | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [networkBanner, setNetworkBanner] = useState<string | null>(null);
  const [focusBusy, setFocusBusy] = useState(false);
  const [minutesDraft, setMinutesDraft] = useState('');
  const [sizeDraft, setSizeDraft] = useState<number>(2);
  const [effortError, setEffortError] = useState<string | null>(null);
  const [effortSaving, setEffortSaving] = useState(false);

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
    const open = openSortedTasks(rRes.data.tasks);
    const next = pickFocusTask(rRes.data.tasks);
    setFocusTask(next);
    setNextTask(nextTaskAfterFocus(next, open));
    if (next?.tagKey) {
      const tag = tRes.data.find((x) => x.key === next.tagKey);
      setTagColor(tag?.color);
    } else {
      setTagColor(undefined);
    }
  }, [client, date, onUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!focusTask) {
      setMinutesDraft('');
      setSizeDraft(2);
      setEffortError(null);
      return;
    }
    setMinutesDraft(focusTask.estimatedMinutes != null ? String(focusTask.estimatedMinutes) : '');
    setSizeDraft(focusTask.size);
    setEffortError(null);
  }, [focusTask?.id, focusTask?.estimatedMinutes, focusTask?.size]);

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
        toast.error(result.error.message);
        setNetworkBanner(result.error.message);
        return;
      }
      toast.error(result.error.message);
      setLoadError(result.error.message);
      return;
    }
    toast.success(t('ongoing.taskComplete'));
    await load();
  }

  async function saveEffort(): Promise<void> {
    if (!focusTask || effortSaving) {
      return;
    }
    setEffortError(null);
    const trimmed = minutesDraft.trim();
    let estimatedMinutes: number | undefined;
    if (trimmed !== '') {
      const n = Number(trimmed);
      if (!Number.isInteger(n) || n < 0 || n > 2880) {
        setEffortError(t('ongoing.errMinutes'));
        return;
      }
      estimatedMinutes = n;
    }
    const sizeChanged = sizeDraft !== focusTask.size;
    const patch: UpdateTaskInput = { size: sizeDraft as (typeof SIZES)[number] };
    if (trimmed !== '') {
      patch.estimatedMinutes = estimatedMinutes;
    }
    const minutesChanged = trimmed !== '' && estimatedMinutes !== focusTask.estimatedMinutes;
    if (!sizeChanged && !minutesChanged) {
      return;
    }
    setEffortSaving(true);
    const result = await client.updateTask(focusTask.id, patch);
    setEffortSaving(false);
    if (!result.ok) {
      if (result.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(result.error)) {
        toast.error(result.error.message);
        setNetworkBanner(result.error.message);
        return;
      }
      toast.error(result.error.message);
      setEffortError(result.error.message);
      return;
    }
    toast.success(t('ongoing.effortSaved'));
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
        toast.error(result.error.message);
        setNetworkBanner(result.error.message);
        return;
      }
      toast.error(result.error.message);
      setLoadError(result.error.message);
      return;
    }
    toast.success(nextStatus === 'planned' ? t('ongoing.paused') : t('ongoing.focusStarted'));
    await load();
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.back} to="/rundown">
          {t('common.backToRundown')}
        </Link>
      </header>

      {networkBanner ? (
        <div className={styles.banner} role="status">
          <p className={styles.bannerText}>
            {t('common.networkErrorPrefix')} {networkBanner}
          </p>
          <button type="button" className={styles.retry} onClick={() => void load()}>
            {t('common.retry')}
          </button>
        </div>
      ) : null}

      {loadError ? <p className={styles.err}>{loadError}</p> : null}

      {!focusTask && !loadError && !networkBanner ? <p className={styles.celebrate}>{t('ongoing.caughtUp')}</p> : null}

      {focusTask ? (
        <section className={styles.card} aria-live="polite">
          <div className={styles.strip} style={{ background: tagColor ?? 'var(--dp-tag-unknown)' }} aria-hidden />
          <div className={styles.inner}>
            <p className={styles.kicker}>{t('ongoing.now')}</p>
            <h1 className={styles.taskTitle}>{focusTask.title}</h1>
            <p className={styles.subRow}>
              <span className={styles.sizeBadge} data-size={focusTask.size}>
                {t('ongoing.size', { size: focusTask.size })}
              </span>
              {focusTask.tagKey ? <span className={styles.tagKey}>{focusTask.tagKey}</span> : null}
            </p>

            <div className={styles.effortPanel}>
              <p className={styles.effortLabel}>{t('ongoing.plannedEffort')}</p>
              <div className={styles.effortRow}>
                <label className={styles.effortField}>
                  <span className={styles.effortHint}>{t('ongoing.estMinutesHint')}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={styles.effortInput}
                    value={minutesDraft}
                    onChange={(e) => setMinutesDraft(e.target.value)}
                    placeholder={t('ongoing.minutesFromSizePh', { minutes: focusTask.size * SIZE_MINUTES })}
                    aria-invalid={effortError ? true : undefined}
                    aria-describedby={effortError ? 'effort-err' : undefined}
                  />
                </label>
                <label className={styles.effortField}>
                  <span className={styles.effortHint}>{t('ongoing.sizeLabel')}</span>
                  <select
                    className={styles.effortSelect}
                    value={sizeDraft}
                    onChange={(e) => setSizeDraft(Number(e.target.value) as (typeof SIZES)[number])}
                  >
                    {SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {effortError ? (
                <p id="effort-err" className={styles.effortErr} role="alert">
                  {effortError}
                </p>
              ) : (
                <p className={styles.effortFootnote}>{t('ongoing.effortFootnote')}</p>
              )}
              <button
                type="button"
                className={styles.effortSave}
                disabled={effortSaving}
                onClick={() => void saveEffort()}
              >
                {effortSaving ? t('common.saving') : t('ongoing.saveEffort')}
              </button>
            </div>

            <div className={styles.progressWrap}>
              <div className={styles.progressMeta}>
                <span>{t('ongoing.elapsed')}</span>
                <span>{elapsedLabel}</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <p className={styles.progressHint}>{t('ongoing.progressHint', { minutes: targetMinutes })}</p>
            </div>

            {focusTask.status === 'planned' || focusTask.status === 'in_progress' ? (
              <button
                type="button"
                className={styles.focusToggleBtn}
                disabled={focusBusy}
                onClick={() => void toggleFocusStatus()}
              >
                {focusBusy
                  ? t('ongoing.updating')
                  : focusTask.status === 'in_progress'
                    ? t('taskCard.pause')
                    : t('taskCard.start')}
              </button>
            ) : null}

            <button type="button" className={styles.doneBtn} onClick={() => void markComplete()}>
              {t('ongoing.markComplete')}
            </button>
            {isDocumentPiPSupported() ? (
              <FocusPiPControl
                focusTask={focusTask}
                nextTask={nextTask}
                tagColor={tagColor}
                elapsedLabel={elapsedLabel}
                progressPct={progress}
                targetMinutes={targetMinutes}
                focusBusy={focusBusy}
                onToggleFocus={() => void toggleFocusStatus()}
                onMarkComplete={() => void markComplete()}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {focusTask && nextTask ? (
        <section className={styles.nextCard} aria-label="Next after this task">
          <p className={styles.nextKicker}>{t('ongoing.nextUp')}</p>
          <p className={styles.nextTitle}>{nextTask.title}</p>
          <p className={styles.nextMeta}>
            {t('ongoing.nextMeta', {
              minutes: nextTask.estimatedMinutes ?? nextTask.size * SIZE_MINUTES,
              size: nextTask.size,
              tagSuffix: nextTask.tagKey ? ` · ${nextTask.tagKey}` : '',
            })}
          </p>
        </section>
      ) : null}

      {focusTask && !nextTask ? (
        <p className={styles.nextNone} role="status">
          {t('ongoing.lastOpen')}
        </p>
      ) : null}
    </div>
  );
}
