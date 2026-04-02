import type { DayPartyClient } from '@dayparty/api-client';
import { ERROR_CODES, type TaskEssentiality } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { isLikelyNetworkFailure } from '../utils/network-error';
import styles from './CreateTaskPanel.module.css';

const SIZES = [1, 2, 3, 4, 5] as const;

type CreateTaskPanelProps = {
  client: DayPartyClient;
  scheduledDate: string;
  onUnauthorized: () => void;
  onNetworkError: (message: string) => void;
  onOtherError: (message: string) => void;
  onSuccess: () => void | Promise<void>;
};

export function CreateTaskPanel({
  client,
  scheduledDate,
  onUnauthorized,
  onNetworkError,
  onOtherError,
  onSuccess,
}: CreateTaskPanelProps): ReactElement {
  const [title, setTitle] = useState('');
  const [size, setSize] = useState<(typeof SIZES)[number]>(2);
  const [minutesRaw, setMinutesRaw] = useState('');
  const [essentiality, setEssentiality] = useState<TaskEssentiality>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setLocalError(null);
    const trimmed = title.trim();
    if (!trimmed) {
      setLocalError('Add a title for the task.');
      return;
    }

    let estimatedMinutes: number | undefined;
    const m = minutesRaw.trim();
    if (m !== '') {
      const n = Number(m);
      if (!Number.isInteger(n) || n < 0 || n > 2880) {
        setLocalError('Estimated minutes must be a whole number from 0 to 2880.');
        return;
      }
      estimatedMinutes = n;
    }

    const body = {
      title: trimmed,
      size,
      scheduledDate,
      ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
      ...(essentiality !== 'normal' ? { essentiality } : {}),
    };

    setSubmitting(true);
    const result = await client.createTask(body);
    setSubmitting(false);

    if (!result.ok) {
      if (result.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(result.error)) {
        onNetworkError(result.error.message);
        return;
      }
      onOtherError(result.error.message);
      return;
    }

    setTitle('');
    setMinutesRaw('');
    await onSuccess();
  }

  return (
    <section className={styles.panel} aria-label="Create task">
      <h2 className={styles.title}>New task</h2>
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input
            className={styles.textInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={500}
            placeholder="What needs doing?"
            autoComplete="off"
          />
        </label>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Size</span>
            <select
              className={styles.select}
              value={size}
              onChange={(e) => setSize(Number(e.target.value) as (typeof SIZES)[number])}
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Minutes (optional)</span>
            <input
              className={styles.numberInput}
              type="number"
              min={0}
              max={2880}
              step={1}
              value={minutesRaw}
              onChange={(e) => setMinutesRaw(e.target.value)}
              placeholder="Infer from size if empty"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Importance</span>
            <select
              className={styles.select}
              value={essentiality}
              onChange={(e) => setEssentiality(e.target.value as TaskEssentiality)}
            >
              <option value="normal">Normal</option>
              <option value="essential">Essential</option>
              <option value="optional">Optional</option>
            </select>
          </label>
        </div>
        {localError ? <p className={styles.err}>{localError}</p> : null}
        <button type="button" className={styles.submit} disabled={submitting} onClick={() => void submit()}>
          {submitting ? 'Adding…' : 'Add task'}
        </button>
      </div>
    </section>
  );
}
