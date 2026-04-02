import type { DayCapacityHint, TaskRundownItemResponse } from '@dayparty/api-client';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [pickDate, setPickDate] = useState(tomorrowDate);

  const hintForPick = hints.find((h) => h.date === pickDate);
  const hintLabel = hintForPick != null ? t('triage.hintFree', { minutes: hintForPick.remainingMinutes }) : null;

  return (
    <div className={styles.wrap} aria-label={t('triage.ariaTask', { title: task.title })}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.btn}
          disabled={busy || tomorrowDate === task.scheduledDate}
          onClick={() => void onDeferTomorrow()}
        >
          {t('triage.tomorrow')}
        </button>
        <button
          type="button"
          className={styles.btn}
          disabled={busy || task.essentiality === 'optional'}
          onClick={() => void onDemote()}
          title={t('triage.lowerTitle')}
        >
          {t('triage.lowerPriority')}
        </button>
        {task.status === 'skipped' ? (
          <button type="button" className={styles.btn} disabled={busy} onClick={() => void onClearSkipped()}>
            {t('triage.undoSkip')}
          </button>
        ) : (
          <button type="button" className={styles.btnGhost} disabled={busy} onClick={() => void onMarkSkipped()}>
            {t('triage.skipToday')}
          </button>
        )}
      </div>
      <div className={styles.moveRow}>
        <label className={styles.moveLabel}>
          {t('triage.moveToDate')}
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
          {t('triage.move')}
        </button>
      </div>
    </div>
  );
}
