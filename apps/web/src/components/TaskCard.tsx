import type { TaskRundownItemResponse } from '@dayparty/api-client';
import type { ReactElement } from 'react';
import styles from './TaskCard.module.css';

export type TaskRunwayPlacement = 'in-runway' | 'outside-runway' | 'complete';

type TaskCardProps = {
  task: TaskRundownItemResponse;
  tagColor?: string;
  runwayPlacement: TaskRunwayPlacement;
  onToggleComplete: (task: TaskRundownItemResponse) => void;
};

export function TaskCard({ task, tagColor, runwayPlacement, onToggleComplete }: TaskCardProps): ReactElement {
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
              aria-label={task.isComplete ? `Mark “${task.title}” incomplete` : `Mark “${task.title}” complete`}
            />
            <span className={`${styles.title} ${task.isComplete ? styles.titleDone : ''}`}>{task.title}</span>
          </label>
          <div className={styles.tagRow}>
            {task.essentiality === 'essential' ? (
              <span className={styles.essTag} title="Essential — keep in the runway if possible">
                Essential
              </span>
            ) : null}
            {task.essentiality === 'optional' ? <span className={styles.optTag}>Optional</span> : null}
            {task.status === 'skipped' ? <span className={styles.skipTag}>Skipped today</span> : null}
            {runwayPlacement === 'outside-runway' && !task.isComplete ? (
              <span className={styles.runwayTag}>Outside window</span>
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
            <span className={styles.minutesBadge} title="Estimated minutes">
              {task.estimatedMinutes}m
            </span>
          ) : null}
          <span className={styles.sizeBadge} data-size={task.size}>
            {task.size}
          </span>
        </div>
      </div>
    </article>
  );
}
