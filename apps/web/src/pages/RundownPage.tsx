import type {
  DayCapacityHint,
  DayRundownResponse,
  TagResponse,
  TaskRundownItemResponse,
  TaskTriageInput,
} from '@dayparty/api-client';
import { ERROR_CODES, type VisualPreset } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CreateTaskPanel } from '../components/CreateTaskPanel';
import { PlanHistoryPanel } from '../components/PlanHistoryPanel';
import { TaskCard, type TaskRunwayPlacement } from '../components/TaskCard';
import { TaskEditPanel } from '../components/TaskEditPanel';
import { TaskNotesPanel } from '../components/TaskNotesPanel';
import { TaskTriageBar } from '../components/TaskTriageBar';
import { useVisualPreset } from '../context/visual-preset-context';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';
import { minutesToTimeInput, timeInputToMinutes } from '../utils/time-of-day';
import { addLocalCalendarDays, isValidLocalIsoDate, todayLocalDateString } from '../utils/today-local';
import styles from './RundownPage.module.css';

function runwayPlacementForTask(
  task: TaskRundownItemResponse,
  dayFit: DayRundownResponse['dayFit'],
): TaskRunwayPlacement {
  if (task.isComplete) {
    return 'complete';
  }
  return dayFit.outsideRunwayTaskIds.includes(task.id) ? 'outside-runway' : 'in-runway';
}

function showTriageForTask(task: TaskRundownItemResponse, dayFit: DayRundownResponse['dayFit']): boolean {
  if (task.isComplete) {
    return false;
  }
  if (task.status === 'skipped') {
    return true;
  }
  return dayFit.overflowUnresolved || dayFit.outsideRunwayTaskIds.includes(task.id);
}

const PRESET_OPTIONS: { value: VisualPreset; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'calm', label: 'Calm' },
  { value: 'playful', label: 'Playful' },
  { value: 'highContrast', label: 'High contrast' },
];

function planningDayLabel(iso: string, todayIso: string): string {
  if (iso === todayIso) {
    return 'Today';
  }
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function RundownPage(): ReactElement {
  const { client, onUnauthorized } = useAuth();
  const { visualPreset, presetError, savingPreset, saveVisualPreset } = useVisualPreset();
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
  const dayTitle = useMemo(() => planningDayLabel(date, todayIso), [date, todayIso]);

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
        setNetworkBanner(result.error.message);
        return;
      }
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
        setNetworkBanner(result.error.message);
        return;
      }
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
        setNetworkBanner(result.error.message);
        return;
      }
      setLoadError(result.error.message);
      return;
    }
    await load();
  }

  async function saveDayWindow(): Promise<void> {
    setWindowError(null);
    const startMin = timeInputToMinutes(winStart);
    const endMin = timeInputToMinutes(winEnd);
    if (!winCrosses && startMin >= endMin) {
      setWindowError('When the window does not cross midnight, start must be before end.');
      return;
    }
    if (winCrosses && startMin <= endMin) {
      setWindowError('When crossing midnight, start (evening) must be after end (morning).');
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
      setWindowError(res.error.message);
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
          <nav className={styles.dateNav} aria-label="Planning date">
            <button
              type="button"
              className={styles.dateStep}
              aria-label="Previous day"
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
              aria-label="Select planning date"
            />
            <button
              type="button"
              className={styles.dateStep}
              aria-label="Next day"
              onClick={() => setPlanningDate(addLocalCalendarDays(date, 1))}
            >
              →
            </button>
            {date !== todayIso ? (
              <button type="button" className={styles.dateToday} onClick={() => setPlanningDate(todayIso)}>
                Today
              </button>
            ) : null}
          </nav>
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
        <div className={styles.headerActions}>
          <Link className={styles.headerLink} to="/rewards">
            Rewards
          </Link>
          <Link className={styles.ongoingBtn} to="/ongoing">
            Ongoing
          </Link>
        </div>
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

      {rundown ? (
        <section className={styles.planPanel} aria-label="Day plan and window">
          <div className={styles.planStats}>
            <span>
              <strong>{rundown.dayFit.plannedMinutes}</strong> min planned
            </span>
            <span className={styles.planSep}>·</span>
            <span>
              <strong>{rundown.dayFit.availableMinutes}</strong> min in window
            </span>
            {rundown.dayFit.overflowUnresolved ? (
              <span className={styles.planWarn}>Essential work does not fit — use triage actions below each task.</span>
            ) : null}
          </div>
          <div className={styles.planBar} role="presentation">
            <div className={styles.planBarFill} style={{ width: `${planLoadPercent}%` }} />
          </div>
          <details className={styles.windowDetails}>
            <summary className={styles.windowSummary}>Day window</summary>
            <div className={styles.windowForm}>
              <p className={styles.windowHint}>
                Adjust when your planning day runs. Times use a 24-hour clock in your local timezone.
              </p>
              <div className={styles.windowRow}>
                <label className={styles.windowLabel}>
                  Start
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={winStart}
                    step={300}
                    onChange={(e) => setWinStart(e.target.value)}
                  />
                </label>
                <label className={styles.windowLabel}>
                  End
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
                Window crosses midnight (night shift)
              </label>
              {windowError ? <p className={styles.windowErr}>{windowError}</p> : null}
              <button
                type="button"
                className={styles.saveWindowBtn}
                disabled={savingWindow}
                onClick={() => void saveDayWindow()}
              >
                {savingWindow ? 'Saving…' : 'Save window'}
              </button>
              <div className={styles.presetRow}>
                <label className={styles.presetLabel} htmlFor="visual-preset">
                  Look &amp; feel
                  <select
                    id="visual-preset"
                    className={styles.presetSelect}
                    value={visualPreset ?? 'default'}
                    disabled={visualPreset === null || savingPreset}
                    onChange={(e) => {
                      const next = e.target.value as VisualPreset;
                      void saveVisualPreset(next);
                    }}
                  >
                    {PRESET_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className={styles.presetHint}>Applies across Today, Ongoing, and Rewards while signed in.</p>
                {presetError ? <p className={styles.presetErr}>{presetError}</p> : null}
              </div>
            </div>
          </details>
          <PlanHistoryPanel
            client={client}
            onUnauthorized={onUnauthorized}
            onNetworkError={(msg) => setNetworkBanner(msg)}
          />
        </section>
      ) : null}

      <CreateTaskPanel
        client={client}
        scheduledDate={date}
        onUnauthorized={onUnauthorized}
        onNetworkError={(msg) => setNetworkBanner(msg)}
        onOtherError={(msg) => setLoadError(msg)}
        onSuccess={load}
      />

      <ul className={styles.list}>
        {sortedTasks.map((task) => (
          <li key={task.id} className={styles.li}>
            <TaskCard
              task={task}
              tagColor={task.tagKey ? tagColorByKey.get(task.tagKey) : undefined}
              runwayPlacement={rundown ? runwayPlacementForTask(task, rundown.dayFit) : 'in-runway'}
              onToggleComplete={toggleTask}
              focusBusy={focusBusyId === task.id}
              onToggleFocus={toggleTaskFocus}
            />
            <TaskEditPanel
              client={client}
              taskId={task.id}
              tags={tags ?? []}
              onUnauthorized={onUnauthorized}
              onNetworkError={(msg) => setNetworkBanner(msg)}
              onOtherError={(msg) => setLoadError(msg)}
              onSaved={load}
            />
            {rundown && showTriageForTask(task, rundown.dayFit) ? (
              <TaskTriageBar
                task={task}
                listDate={date}
                tomorrowDate={tomorrowDate}
                hints={capacityHints}
                busy={triageBusyId === task.id}
                onDeferTomorrow={() => runTriage(task.id, { action: 'defer_to_date', targetDate: tomorrowDate })}
                onDeferToDate={(targetDate) => runTriage(task.id, { action: 'defer_to_date', targetDate })}
                onDemote={() => runTriage(task.id, { action: 'demote' })}
                onMarkSkipped={() => runTriage(task.id, { action: 'mark_skipped' })}
                onClearSkipped={() => runTriage(task.id, { action: 'clear_skipped' })}
              />
            ) : null}
            <TaskNotesPanel
              client={client}
              taskId={task.id}
              taskTitle={task.title}
              notesPreview={task.notesPreview}
              onUnauthorized={onUnauthorized}
              onSaved={onNotesSaved}
            />
          </li>
        ))}
      </ul>

      {rundown && sortedTasks.length === 0 ? <p className={styles.empty}>No tasks for this day yet.</p> : null}
    </div>
  );
}
