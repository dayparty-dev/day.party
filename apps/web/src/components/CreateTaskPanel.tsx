import type { CreateTaskInput, DayPartyClient } from '@dayparty/api-client';
import { ERROR_CODES, type TaskEssentiality } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isLikelyNetworkFailure } from '../utils/network-error';
import styles from './CreateTaskPanel.module.css';

const SIZES = [1, 2, 3, 4, 5] as const;

function parseBountyTagKeys(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

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
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [size, setSize] = useState<(typeof SIZES)[number]>(2);
  const [minutesRaw, setMinutesRaw] = useState('');
  const [essentiality, setEssentiality] = useState<TaskEssentiality>('normal');
  const [bountyAmountRaw, setBountyAmountRaw] = useState('');
  const [bountyTagKeysRaw, setBountyTagKeysRaw] = useState('');
  const [bountyHighResistance, setBountyHighResistance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setLocalError(null);
    const trimmed = title.trim();
    if (!trimmed) {
      setLocalError(t('createTask.errTitle'));
      return;
    }

    let estimatedMinutes: number | undefined;
    const m = minutesRaw.trim();
    if (m !== '') {
      const n = Number(m);
      if (!Number.isInteger(n) || n < 0 || n > 2880) {
        setLocalError(t('createTask.errMinutes'));
        return;
      }
      estimatedMinutes = n;
    }

    let bounty: CreateTaskInput['bounty'];
    const bRaw = bountyAmountRaw.trim();
    if (bRaw !== '') {
      const amt = Number(bRaw);
      if (!Number.isInteger(amt) || amt < 1 || amt > 1_000_000) {
        setLocalError(t('createTask.errBounty'));
        return;
      }
      const tagKeys = parseBountyTagKeys(bountyTagKeysRaw);
      bounty = {
        amount: amt,
        ...(tagKeys.length > 0 ? { tagKeys } : {}),
        ...(bountyHighResistance ? { highResistance: true } : {}),
      };
    }

    const body: CreateTaskInput = {
      title: trimmed,
      size,
      scheduledDate,
      ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
      ...(essentiality !== 'normal' ? { essentiality } : {}),
      ...(bounty !== undefined ? { bounty } : {}),
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
    setBountyAmountRaw('');
    setBountyTagKeysRaw('');
    setBountyHighResistance(false);
    await onSuccess();
  }

  return (
    <section className={styles.panel} aria-label={t('rundown.ariaCreateTask')}>
      <h2 className={styles.title}>{t('createTask.title')}</h2>
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>{t('createTask.fieldTitle')}</span>
          <input
            className={styles.textInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={500}
            placeholder={t('createTask.placeholderTitle')}
            autoComplete="off"
          />
        </label>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>{t('createTask.size')}</span>
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
            <span className={styles.label}>{t('createTask.minutesOptional')}</span>
            <input
              className={styles.numberInput}
              type="number"
              min={0}
              max={2880}
              step={1}
              value={minutesRaw}
              onChange={(e) => setMinutesRaw(e.target.value)}
              placeholder={t('createTask.minutesPlaceholder')}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t('createTask.importance')}</span>
            <select
              className={styles.select}
              value={essentiality}
              onChange={(e) => setEssentiality(e.target.value as TaskEssentiality)}
            >
              <option value="normal">{t('createTask.importanceNormal')}</option>
              <option value="essential">{t('createTask.importanceEssential')}</option>
              <option value="optional">{t('createTask.importanceOptional')}</option>
            </select>
          </label>
        </div>
        <div className={styles.bountyBlock}>
          <span className={styles.label}>{t('createTask.bountyOptional')}</span>
          <label className={styles.field}>
            <span className={styles.label}>{t('createTask.bountyAmount')}</span>
            <input
              className={styles.numberInput}
              inputMode="numeric"
              value={bountyAmountRaw}
              onChange={(e) => setBountyAmountRaw(e.target.value)}
              placeholder={t('createTask.bountyNone')}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t('createTask.bountyTags')}</span>
            <input
              className={styles.textInput}
              value={bountyTagKeysRaw}
              onChange={(e) => setBountyTagKeysRaw(e.target.value)}
              placeholder={t('createTask.bountyTagsPh')}
            />
          </label>
          <label className={styles.inlineChecks}>
            <input
              type="checkbox"
              checked={bountyHighResistance}
              onChange={(e) => setBountyHighResistance(e.target.checked)}
            />
            {t('createTask.highResistance')}
          </label>
        </div>
        {localError ? <p className={styles.err}>{localError}</p> : null}
        <button type="button" className={styles.submit} disabled={submitting} onClick={() => void submit()}>
          {submitting ? t('createTask.adding') : t('createTask.addTask')}
        </button>
      </div>
    </section>
  );
}
