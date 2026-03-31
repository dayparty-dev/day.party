import type { TaskResponse } from '@dayparty/api-client';
import type { ReactElement } from 'react';
import styles from './TaskCard.module.css';

type TaskCardProps = {
  task: TaskResponse;
  tagColor?: string;
  onToggleComplete: (task: TaskResponse) => void;
};

export function TaskCard({ task, tagColor, onToggleComplete }: TaskCardProps): ReactElement {
  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.colorStrip}
        style={{ background: tagColor ?? 'var(--dp-tag-unknown)' }}
        aria-hidden
        tabIndex={-1}
      />
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
        <span className={styles.sizeBadge} data-size={task.size}>
          {task.size}
        </span>
      </div>
    </article>
  );
}
