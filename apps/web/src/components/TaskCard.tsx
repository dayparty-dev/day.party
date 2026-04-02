import type { TaskRundownItemResponse } from '@dayparty/api-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TaskCard.module.css';

export type TaskRunwayPlacement = 'in-runway' | 'outside-runway' | 'complete';

type TaskCardProps = {
  task: TaskRundownItemResponse;
  tagColor?: string;
  runwayPlacement: TaskRunwayPlacement;
  onToggleComplete: (task: TaskRundownItemResponse) => void;
  focusBusy?: boolean;
  onToggleFocus?: (task: TaskRundownItemResponse) => void;
};

export function TaskCard({
  task,
  tagColor,
  runwayPlacement,
  onToggleComplete,
  focusBusy = false,
  onToggleFocus,
}: TaskCardProps): ReactElement {
  const { t } = useTranslation();
  const cardClass =
    runwayPlacement === 'outside-runway'
      ? `${styles.card} ${styles.cardOutside}`
      : runwayPlacement === 'complete'
        ? `${styles.card} ${styles.cardComplete}`
        : styles.card;

  return (
    <article className={cardClass} data-runway={runwayPlacement}>
      <button
        type="button"
        className={styles.colorStrip}
        style={{ background: tagColor ?? 'var(--dp-tag-unknown)' }}
        aria-hidden
        tabIndex={-1}
      />
      <div className={styles.content}>
        <div className={styles.body}>
          <label className={styles.titleRow}>
            <input
              type="checkbox"
              className={styles.check}
              checked={task.isComplete}
              onChange={() => onToggleComplete(task)}
              aria-label={
                task.isComplete
                  ? t('taskCard.markIncomplete', { title: task.title })
                  : t('taskCard.markComplete', { title: task.title })
              }
            />
            <span className={`${styles.title} ${task.isComplete ? styles.titleDone : ''}`}>{task.title}</span>
          </label>
          <div className={styles.tagRow}>
            {task.essentiality === 'essential' ? (
              <span className={styles.essTag} title={t('taskCard.essentialTitle')}>
                {t('taskCard.essential')}
              </span>
            ) : null}
            {task.essentiality === 'optional' ? <span className={styles.optTag}>{t('taskCard.optional')}</span> : null}
            {task.status === 'skipped' ? <span className={styles.skipTag}>{t('taskCard.skippedToday')}</span> : null}
            {task.status === 'in_progress' ? (
              <span className={styles.focusTag} title={t('taskCard.inFocusTitle')}>
                {t('taskCard.inProgress')}
              </span>
            ) : null}
            {runwayPlacement === 'outside-runway' && !task.isComplete ? (
              <span className={styles.runwayTag}>{t('taskCard.outsideWindow')}</span>
            ) : null}
            {task.notesPreview ? (
              <p className={styles.notesPreview} title={task.notesPreview}>
                {task.notesPreview}
              </p>
            ) : null}
          </div>
        </div>
        <div className={styles.badges}>
          {task.estimatedMinutes != null ? (
            <span className={styles.minutesBadge} title={t('taskCard.estMinutesTitle')}>
              {task.estimatedMinutes}m
            </span>
          ) : null}
          <span className={styles.sizeBadge} data-size={task.size}>
            {task.size}
          </span>
          {!task.isComplete && (task.status === 'planned' || task.status === 'in_progress') && onToggleFocus ? (
            <button type="button" className={styles.focusBtn} disabled={focusBusy} onClick={() => onToggleFocus(task)}>
              {focusBusy ? '…' : task.status === 'in_progress' ? t('taskCard.pause') : t('taskCard.start')}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
