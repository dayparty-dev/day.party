import type { DayCapacityHint, TaskRundownItemResponse } from '@dayparty/api-client';
import type { ReactElement } from 'react';
import { useState } from 'react';
import styles from './TaskTriageBar.module.css';

type TaskTriageBarProps = {
  task: TaskRundownItemResponse;
  listDate: string;
  tomorrowDate: string;
  hints: DayCapacityHint[];
  busy: boolean;
  onDeferTomorrow: () => void | Promise<void>;
  onDeferToDate: (targetDate: string) => void | Promise<void>;
  onDemote: () => void | Promise<void>;
  onMarkSkipped: () => void | Promise<void>;
  onClearSkipped: () => void | Promise<void>;
};

export function TaskTriageBar({
  task,
  listDate,
  tomorrowDate,
  hints,
  busy,
  onDeferTomorrow,
  onDeferToDate,
  onDemote,
  onMarkSkipped,
  onClearSkipped,
}: TaskTriageBarProps): ReactElement {
  const [pickDate, setPickDate] = useState(tomorrowDate);

  const hintForPick = hints.find((h) => h.date === pickDate);
  const hintLabel = hintForPick != null ? `≈ ${hintForPick.remainingMinutes}m free` : null;

  return (
    <div className={styles.wrap} aria-label={`Triage actions for ${task.title}`}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.btn}
          disabled={busy || tomorrowDate === task.scheduledDate}
          onClick={() => void onDeferTomorrow()}
        >
          Tomorrow
        </button>
        <button
          type="button"
          className={styles.btn}
          disabled={busy || task.essentiality === 'optional'}
          onClick={() => void onDemote()}
          title="Mark as optional to ease runway pressure"
        >
          Lower priority
        </button>
        {task.status === 'skipped' ? (
          <button type="button" className={styles.btn} disabled={busy} onClick={() => void onClearSkipped()}>
            Undo skip
          </button>
        ) : (
          <button type="button" className={styles.btnGhost} disabled={busy} onClick={() => void onMarkSkipped()}>
            Skip today
          </button>
        )}
      </div>
      <div className={styles.moveRow}>
        <label className={styles.moveLabel}>
          Move to date
          <input
            type="date"
            className={styles.dateInput}
            value={pickDate}
            min={listDate}
            onChange={(e) => setPickDate(e.target.value)}
          />
        </label>
        {hintLabel ? <span className={styles.hint}>{hintLabel}</span> : null}
        <button
          type="button"
          className={styles.btn}
          disabled={busy || pickDate === task.scheduledDate}
          onClick={() => void onDeferToDate(pickDate)}
        >
          Move
        </button>
      </div>
    </div>
  );
}
