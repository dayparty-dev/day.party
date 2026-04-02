import type { DayPartyClient } from '@dayparty/api-client';
import { ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { isLikelyNetworkFailure } from '../utils/network-error';
import styles from './TaskNotesPanel.module.css';

type TaskNotesPanelProps = {
  client: DayPartyClient;
  taskId: string;
  taskTitle: string;
  notesPreview?: string;
  onUnauthorized: () => void;
  onSaved: () => void | Promise<void>;
};

export function TaskNotesPanel({
  client,
  taskId,
  taskTitle,
  notesPreview,
  onUnauthorized,
  onSaved,
}: TaskNotesPanelProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoaded(false);
    setDraft('');
    setError(null);
  }, [taskId]);

  useEffect(() => {
    if (!open) {
      setLoaded(false);
    }
  }, [open]);

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
        setError(res.error.message);
        return;
      }
      setDraft(res.data.notesMarkdown ?? '');
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded, taskId, client, onUnauthorized]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    const res = await client.updateTask(taskId, { notesMarkdown: draft });
    setSaving(false);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(res.error)) {
        setError(res.error.message);
        return;
      }
      setError(res.error.message);
      return;
    }
    await onSaved();
  }, [client, taskId, draft, onUnauthorized, onSaved]);

  const summaryHint = notesPreview ? `${notesPreview.slice(0, 60)}${notesPreview.length > 60 ? '…' : ''}` : null;

  return (
    <details className={styles.wrap} open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className={styles.summary}>
        <span className={styles.summaryLabel}>Notes</span>
        {summaryHint ? <span className={styles.summaryPreview}>{summaryHint}</span> : null}
      </summary>
      <div className={styles.body}>
        <p className={styles.caption} id={`notes-heading-${taskId}`}>
          Notes for “{taskTitle}”
        </p>
        {loading ? <p className={styles.muted}>Loading…</p> : null}
        {error ? <p className={styles.err}>{error}</p> : null}
        {!loading && loaded ? (
          <>
            <label className={styles.editorLabel}>
              Markdown
              <textarea
                className={styles.textarea}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                spellCheck
                aria-labelledby={`notes-heading-${taskId}`}
              />
            </label>
            <div className={styles.previewBlock}>
              <span className={styles.previewLabel}>Preview</span>
              <div className={styles.preview}>
                {draft.trim() ? (
                  <ReactMarkdown>{draft}</ReactMarkdown>
                ) : (
                  <p className={styles.muted}>Nothing to preview yet.</p>
                )}
              </div>
            </div>
            <button type="button" className={styles.saveBtn} disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save notes'}
            </button>
          </>
        ) : null}
      </div>
    </details>
  );
}
