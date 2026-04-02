import type {
  DayCapacityHint,
  DayRundownResponse,
  TagResponse,
  TaskRundownItemResponse,
  TaskTriageInput,
} from '@dayparty/api-client';
import { ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { CreateTaskPanel } from '../components/CreateTaskPanel';
import { FeedbackForm } from '../components/FeedbackForm';
import { PlanHistoryPanel } from '../components/PlanHistoryPanel';
import { RunwayTaskList } from '../components/RunwayTaskList';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';
import { minutesToTimeInput, timeInputToMinutes } from '../utils/time-of-day';
import { addLocalCalendarDays, isValidLocalIsoDate, todayLocalDateString } from '../utils/today-local';
import styles from './RundownPage.module.css';

function planningDayLabel(iso: string, todayIso: string, lang: string, todayLabel: string): string {
  if (iso === todayIso) {
    return todayLabel;
  }
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const loc = lang === 'es' ? 'es' : 'en-US';
  return dt.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function RundownPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const { client, onUnauthorized, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const todayIso = useMemo(() => todayLocalDateString(), []);

  useEffect(() => {
    const q = searchParams.get('date');
    if (q && isValidLocalIsoDate(q)) {
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('date', todayIso);
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams, todayIso]);

  const dateParam = searchParams.get('date');
  const date = dateParam && isValidLocalIsoDate(dateParam) ? dateParam : todayIso;
  const dayTitle = useMemo(
    () => planningDayLabel(date, todayIso, i18n.language, t('common.today')),
    [date, todayIso, i18n.language, t],
  );

  const setPlanningDate = useCallback(
    (nextIso: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('date', nextIso);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const [rundown, setRundown] = useState<DayRundownResponse | null>(null);
  const [tags, setTags] = useState<TagResponse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [networkBanner, setNetworkBanner] = useState<string | null>(null);
  const [windowError, setWindowError] = useState<string | null>(null);
  const [savingWindow, setSavingWindow] = useState(false);
  const [capacityHints, setCapacityHints] = useState<DayCapacityHint[]>([]);
  const [triageBusyId, setTriageBusyId] = useState<string | null>(null);
  const [focusBusyId, setFocusBusyId] = useState<string | null>(null);

  const tomorrowDate = useMemo(() => addLocalCalendarDays(date, 1), [date]);

  const [winStart, setWinStart] = useState('09:00');
  const [winEnd, setWinEnd] = useState('17:00');
  const [winCrosses, setWinCrosses] = useState(false);

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
    setRundown(rRes.data);
    setTags(tRes.data);

    const to = addLocalCalendarDays(date, 7);
    const sRes = await client.getDaySuggestions({ fromDate: date, toDate: to });
    if (sRes.ok) {
      setCapacityHints(sRes.data.hints);
    }
  }, [client, date, onUnauthorized]);

  const onNotesSaved = useCallback(() => void load(), [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!rundown) {
      return;
    }
    const { dayWindow } = rundown;
    setWinStart(minutesToTimeInput(dayWindow.startMinuteOfDay));
    setWinEnd(minutesToTimeInput(dayWindow.endMinuteOfDay));
    setWinCrosses(dayWindow.crossesMidnight);
  }, [rundown]);

  async function toggleTask(task: TaskRundownItemResponse): Promise<void> {
    const result = await client.updateTask(task.id, { isComplete: !task.isComplete });
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
    await load();
  }

  async function toggleTaskFocus(task: TaskRundownItemResponse): Promise<void> {
    if (task.isComplete) {
      return;
    }
    if (task.status !== 'planned' && task.status !== 'in_progress') {
      return;
    }
    const nextStatus = task.status === 'in_progress' ? 'planned' : 'in_progress';
    setFocusBusyId(task.id);
    const result = await client.updateTask(task.id, { status: nextStatus });
    setFocusBusyId(null);
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
    await load();
  }

  async function runTriage(taskId: string, body: TaskTriageInput): Promise<void> {
    setTriageBusyId(taskId);
    const result = await client.triageTask(taskId, body);
    setTriageBusyId(null);
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
    toast.success(t('rundown.triageUpdated'));
    await load();
  }

  async function saveDayWindow(): Promise<void> {
    setWindowError(null);
    const startMin = timeInputToMinutes(winStart);
    const endMin = timeInputToMinutes(winEnd);
    if (!winCrosses && startMin >= endMin) {
      setWindowError(t('rundown.windowNoCrossError'));
      return;
    }
    if (winCrosses && startMin <= endMin) {
      setWindowError(t('rundown.windowCrossError'));
      return;
    }
    setSavingWindow(true);
    const res = await client.patchUserPreferences({
      dayWindow: {
        startMinuteOfDay: startMin,
        endMinuteOfDay: endMin,
        crossesMidnight: winCrosses,
      },
    });
    setSavingWindow(false);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(res.error)) {
        setNetworkBanner(res.error.message);
        return;
      }
      toast.error(res.error.message);
      setWindowError(res.error.message);
      return;
    }
    toast.success(t('rundown.windowSaved'));
    await load();
  }

  const sortedTasks = useMemo(() => {
    if (!rundown) {
      return [];
    }
    return [...rundown.tasks].sort((a, b) => a.position - b.position);
  }, [rundown]);

  const planLoadPercent = useMemo(() => {
    if (!rundown || rundown.dayFit.availableMinutes <= 0) {
      return 0;
    }
    return Math.min(100, (rundown.dayFit.plannedMinutes / rundown.dayFit.availableMinutes) * 100);
  }, [rundown]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{dayTitle}</h1>
          <nav className={styles.dateNav} aria-label={t('rundown.planningDateAria')}>
            <button
              type="button"
              className={styles.dateStep}
              aria-label={t('rundown.prevDayAria')}
              onClick={() => setPlanningDate(addLocalCalendarDays(date, -1))}
            >
              ←
            </button>
            <input
              className={styles.dateInput}
              type="date"
              value={date}
              onChange={(e) => {
                const v = e.target.value;
                if (v && isValidLocalIsoDate(v)) {
                  setPlanningDate(v);
                }
              }}
              aria-label={t('rundown.pickDateAria')}
            />
            <button
              type="button"
              className={styles.dateStep}
              aria-label={t('rundown.nextDayAria')}
              onClick={() => setPlanningDate(addLocalCalendarDays(date, 1))}
            >
              →
            </button>
            {date !== todayIso ? (
              <button type="button" className={styles.dateToday} onClick={() => setPlanningDate(todayIso)}>
                {t('common.today')}
              </button>
            ) : null}
          </nav>
          <p className={styles.meta}>
            {date}
            {rundown ? (
              <>
                {' · '}
                {t('rundown.metaDone', { completed: rundown.completed, capacity: rundown.capacity })}
              </>
            ) : null}
          </p>
        </div>
        <div className={styles.headerActions}>
          {user?.role === 'admin' ? (
            <Link className={styles.headerLink} to="/admin">
              {t('common.admin')}
            </Link>
          ) : null}
          <Link className={styles.headerLink} to="/help/shortcuts">
            {t('common.shortcuts')}
          </Link>
          <Link className={styles.headerLink} to="/settings">
            {t('common.settings')}
          </Link>
          <Link className={styles.headerLink} to="/tags">
            {t('common.tags')}
          </Link>
          <Link className={styles.headerLink} to="/rewards">
            {t('common.rewards')}
          </Link>
          <Link className={styles.ongoingBtn} to="/ongoing">
            {t('common.ongoing')}
          </Link>
        </div>
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

      {rundown ? (
        <section className={styles.planPanel} aria-label="Day plan and window">
          <div className={styles.planStats}>
            <span>{t('rundown.minPlanned', { minutes: rundown.dayFit.plannedMinutes })}</span>
            <span className={styles.planSep}>·</span>
            <span>{t('rundown.minInWindow', { minutes: rundown.dayFit.availableMinutes })}</span>
            {rundown.dayFit.overflowUnresolved ? (
              <span className={styles.planWarn}>{t('rundown.overflowWarn')}</span>
            ) : null}
          </div>
          <div className={styles.planBar} role="presentation">
            <div className={styles.planBarFill} style={{ width: `${planLoadPercent}%` }} />
          </div>
          <details className={styles.windowDetails}>
            <summary className={styles.windowSummary}>{t('rundown.dayWindow')}</summary>
            <div className={styles.windowForm}>
              <p className={styles.windowHint}>{t('rundown.windowHint')}</p>
              <div className={styles.windowRow}>
                <label className={styles.windowLabel}>
                  {t('rundown.start')}
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={winStart}
                    step={300}
                    onChange={(e) => setWinStart(e.target.value)}
                  />
                </label>
                <label className={styles.windowLabel}>
                  {t('rundown.end')}
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={winEnd}
                    step={300}
                    onChange={(e) => setWinEnd(e.target.value)}
                  />
                </label>
              </div>
              <label className={styles.crossesLabel}>
                <input type="checkbox" checked={winCrosses} onChange={(e) => setWinCrosses(e.target.checked)} />
                {t('rundown.crossesMidnight')}
              </label>
              {windowError ? <p className={styles.windowErr}>{windowError}</p> : null}
              <button
                type="button"
                className={styles.saveWindowBtn}
                disabled={savingWindow}
                onClick={() => void saveDayWindow()}
              >
                {savingWindow ? t('common.saving') : t('rundown.saveWindow')}
              </button>
            </div>
          </details>
          <PlanHistoryPanel
            client={client}
            onUnauthorized={onUnauthorized}
            onNetworkError={(msg) => setNetworkBanner(msg)}
          />
        </section>
      ) : null}

      <details className={styles.feedbackDetails}>
        <summary className={styles.feedbackSummary}>{t('rundown.sendFeedback')}</summary>
        <div className={styles.feedbackBody}>
          <FeedbackForm />
        </div>
      </details>

      <CreateTaskPanel
        client={client}
        scheduledDate={date}
        onUnauthorized={onUnauthorized}
        onNetworkError={(msg) => setNetworkBanner(msg)}
        onOtherError={(msg) => {
          toast.error(msg);
          setLoadError(msg);
        }}
        onSuccess={load}
      />

      {rundown ? (
        <RunwayTaskList
          date={date}
          tomorrowDate={tomorrowDate}
          sortedTasks={sortedTasks}
          rundown={rundown}
          tags={tags ?? []}
          tagColorByKey={tagColorByKey}
          capacityHints={capacityHints}
          triageBusyId={triageBusyId}
          focusBusyId={focusBusyId}
          client={client}
          onUnauthorized={onUnauthorized}
          onNetworkError={(msg) => setNetworkBanner(msg)}
          onOtherError={(msg) => {
            toast.error(msg);
            setLoadError(msg);
          }}
          load={load}
          onNotesSaved={onNotesSaved}
          toggleTask={toggleTask}
          toggleTaskFocus={toggleTaskFocus}
          runTriage={runTriage}
        />
      ) : null}
    </div>
  );
}
