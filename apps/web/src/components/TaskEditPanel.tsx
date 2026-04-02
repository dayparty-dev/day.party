import type { DayPartyClient, TagResponse, TaskResponse, UpdateTaskInput } from '@dayparty/api-client';
import { ERROR_CODES } from '@dayparty/core';
import type { TaskEssentiality, TaskStatus } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isLikelyNetworkFailure } from '../utils/network-error';
import styles from './TaskEditPanel.module.css';

const SIZES = [1, 2, 3, 4, 5] as const;

const STATUSES: TaskStatus[] = ['planned', 'in_progress', 'deferred', 'skipped', 'done'];

const ESSENTIALITIES: TaskEssentiality[] = ['essential', 'normal', 'optional'];

type TaskEditPanelProps = {
  client: DayPartyClient;
  taskId: string;
  tags: TagResponse[];
  onUnauthorized: () => void;
  onNetworkError: (message: string) => void;
  onOtherError: (message: string) => void;
  onSaved: () => void | Promise<void>;
};

function parseBountyTagKeys(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function TaskEditPanel({
  client,
  taskId,
  tags,
  onUnauthorized,
  onNetworkError,
  onOtherError,
  onSaved,
}: TaskEditPanelProps): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [size, setSize] = useState<(typeof SIZES)[number]>(2);
  const [minutesRaw, setMinutesRaw] = useState('');
  const [essentiality, setEssentiality] = useState<TaskEssentiality>('normal');
  const [tagKey, setTagKey] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('planned');
  const [deferredToDate, setDeferredToDate] = useState('');
  const [bountyAmountRaw, setBountyAmountRaw] = useState('');
  const [bountyTagKeysRaw, setBountyTagKeysRaw] = useState('');
  const [bountyHighResistance, setBountyHighResistance] = useState(false);
  const [clearBounty, setClearBounty] = useState(false);
  const [hadBounty, setHadBounty] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(null);
    setClearBounty(false);
  }, [taskId]);

  useEffect(() => {
    if (!open) {
      setLoaded(false);
    }
  }, [open]);

  const hydrate = useCallback((t: TaskResponse) => {
    setTitle(t.title);
    setSize(t.size);
    setMinutesRaw(t.estimatedMinutes != null ? String(t.estimatedMinutes) : '');
    setEssentiality(t.essentiality ?? 'normal');
    setTagKey(t.tagKey ?? '');
    setScheduledDate(t.scheduledDate);
    setStatus(t.status);
    setDeferredToDate(t.deferredToDate ?? '');
    if (t.bounty && t.bounty.amount > 0) {
      setHadBounty(true);
      setBountyAmountRaw(String(t.bounty.amount));
      setBountyTagKeysRaw((t.bounty.tagKeys ?? []).join(', '));
      setBountyHighResistance(Boolean(t.bounty.highResistance));
    } else {
      setHadBounty(false);
      setBountyAmountRaw('');
      setBountyTagKeysRaw('');
      setBountyHighResistance(false);
    }
  }, []);

  useEffect(() => {
    if (!open || loaded) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const res = await client.getTask(taskId);
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!res.ok) {
        if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
          onUnauthorized();
          return;
        }
        if (isLikelyNetworkFailure(res.error)) {
          onNetworkError(res.error.message);
          return;
        }
        setError(res.error.message);
        return;
      }
      hydrate(res.data);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded, taskId, client, onUnauthorized, onNetworkError, hydrate]);

  const save = useCallback(async () => {
    setError(null);
    const trimmed = title.trim();
    if (!trimmed) {
      setError(t('taskEdit.titleRequired'));
      return;
    }
    if (status === 'deferred') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(deferredToDate)) {
        setError(t('taskEdit.deferredDate'));
        return;
      }
    }

    let estimatedMinutes: number | undefined;
    const m = minutesRaw.trim();
    if (m !== '') {
      const n = Number(m);
      if (!Number.isInteger(n) || n < 0 || n > 2880) {
        setError(t('taskEdit.errMinutes'));
        return;
      }
      estimatedMinutes = n;
    }

    let bountyPatch: UpdateTaskInput['bounty'];
    if (clearBounty) {
      bountyPatch = null;
    } else {
      const bRaw = bountyAmountRaw.trim();
      if (bRaw !== '') {
        const amt = Number(bRaw);
        if (!Number.isInteger(amt) || amt < 1 || amt > 1_000_000) {
          setError(t('taskEdit.errBounty'));
          return;
        }
        const tagKeys = parseBountyTagKeys(bountyTagKeysRaw);
        bountyPatch = {
          amount: amt,
          ...(tagKeys.length > 0 ? { tagKeys } : {}),
          ...(bountyHighResistance ? { highResistance: true } : {}),
        };
      }
    }

    const patch: UpdateTaskInput = {
      title: trimmed,
      size,
      scheduledDate,
      essentiality,
      status,
      tagKey: tagKey === '' ? null : tagKey,
      ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
      ...(status === 'deferred' ? { deferredToDate } : {}),
      ...(bountyPatch !== undefined ? { bounty: bountyPatch } : {}),
    };

    setSaving(true);
    const res = await client.updateTask(taskId, patch);
    setSaving(false);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(res.error)) {
        onNetworkError(res.error.message);
        return;
      }
      onOtherError(res.error.message);
      return;
    }
    hydrate(res.data);
    setClearBounty(false);
    setHadBounty(Boolean(res.data.bounty && res.data.bounty.amount > 0));
    await onSaved();
  }, [
    title,
    status,
    deferredToDate,
    minutesRaw,
    clearBounty,
    bountyAmountRaw,
    bountyTagKeysRaw,
    bountyHighResistance,
    size,
    scheduledDate,
    essentiality,
    tagKey,
    client,
    taskId,
    onUnauthorized,
    onNetworkError,
    onOtherError,
    onSaved,
    hydrate,
  ]);

  return (
    <details className={styles.wrap} open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className={styles.summary}>
        <span className={styles.summaryLabel}>{t('taskEdit.summary')}</span>
      </summary>
      <div className={styles.body}>
        <p className={styles.caption}>{t('taskEdit.caption')}</p>
        {loading ? <p className={styles.muted}>{t('common.loading')}</p> : null}
        {error ? <p className={styles.err}>{error}</p> : null}
        {!loading && loaded ? (
          <>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span className={styles.label}>{t('taskEdit.titleField')}</span>
                <input
                  className={styles.textInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={500}
                  autoComplete="off"
                />
              </label>
              <div className={styles.row}>
                <label className={styles.field}>
                  <span className={styles.label}>{t('taskEdit.size')}</span>
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
                  <span className={styles.label}>{t('taskEdit.estMinutes')}</span>
                  <input
                    className={styles.numberInput}
                    inputMode="numeric"
                    value={minutesRaw}
                    onChange={(e) => setMinutesRaw(e.target.value)}
                    placeholder={t('taskEdit.fromSizePh')}
                  />
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.label}>{t('taskEdit.essentiality')}</span>
                <select
                  className={styles.select}
                  value={essentiality}
                  onChange={(e) => setEssentiality(e.target.value as TaskEssentiality)}
                >
                  {ESSENTIALITIES.map((ess) => (
                    <option key={ess} value={ess}>
                      {t(`taskEdit.ess_${ess}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>{t('taskEdit.tag')}</span>
                <select className={styles.select} value={tagKey} onChange={(e) => setTagKey(e.target.value)}>
                  <option value="">{t('taskEdit.tagNone')}</option>
                  {tags.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>{t('taskEdit.scheduledDate')}</span>
                <input
                  className={styles.dateInput}
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>{t('taskEdit.status')}</span>
                <select
                  className={styles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {t(`taskEdit.status_${st}`)}
                    </option>
                  ))}
                </select>
              </label>
              {status === 'deferred' ? (
                <label className={styles.field}>
                  <span className={styles.label}>{t('taskEdit.revisitOn')}</span>
                  <input
                    className={styles.dateInput}
                    type="date"
                    value={deferredToDate}
                    onChange={(e) => setDeferredToDate(e.target.value)}
                  />
                </label>
              ) : null}
              <div className={styles.bountyBlock}>
                <span className={styles.label}>{t('taskEdit.bounty')}</span>
                <label className={styles.field}>
                  <span className={styles.label}>{t('createTask.bountyAmount')}</span>
                  <input
                    className={styles.numberInput}
                    inputMode="numeric"
                    value={bountyAmountRaw}
                    onChange={(e) => {
                      setBountyAmountRaw(e.target.value);
                      setClearBounty(false);
                    }}
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
                {hadBounty ? (
                  <label className={styles.inlineChecks}>
                    <input
                      type="checkbox"
                      checked={clearBounty}
                      onChange={(e) => {
                        setClearBounty(e.target.checked);
                        if (e.target.checked) {
                          setBountyAmountRaw('');
                        }
                      }}
                    />
                    {t('taskEdit.removeBounty')}
                  </label>
                ) : null}
              </div>
            </div>
            <button type="button" className={styles.saveBtn} disabled={saving} onClick={() => void save()}>
              {saving ? t('common.saving') : t('taskEdit.saveChanges')}
            </button>
          </>
        ) : null}
      </div>
    </details>
  );
}
