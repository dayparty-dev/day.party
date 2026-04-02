import type { TagResponse } from '@dayparty/api-client';
import { ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';
import styles from './TagManagerPanel.module.css';

export function TagManagerPanel(): ReactElement {
  const { client, onUnauthorized } = useAuth();
  const [tags, setTags] = useState<TagResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [createKey, setCreateKey] = useState('');
  const [createName, setCreateName] = useState('');
  const [createColor, setCreateColor] = useState('#5b8cff');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<TagResponse | null>(null);
  const [replaceId, setReplaceId] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await client.getTags();
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
    setTags(res.data);
  }, [client, onUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  const replacementOptions = useMemo(() => {
    if (!tags || !deleteTarget) {
      return [];
    }
    return tags.filter((t) => t.id !== deleteTarget.id);
  }, [tags, deleteTarget]);

  async function onCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setCreating(true);
    const res = await client.createTag({
      key: createKey.trim().toLowerCase(),
      displayName: createName.trim(),
      color: createColor || undefined,
    });
    setCreating(false);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      setError(res.error.message);
      return;
    }
    setCreateKey('');
    setCreateName('');
    setCreateColor('#5b8cff');
    await load();
  }

  function startEdit(t: TagResponse): void {
    setEditingId(t.id);
    setEditName(t.displayName);
    setEditColor(t.color ?? '#888888');
  }

  async function saveEdit(id: string): Promise<void> {
    setBusyId(id);
    const res = await client.updateTag(id, {
      displayName: editName.trim(),
      color: editColor || null,
    });
    setBusyId(null);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      setError(res.error.message);
      return;
    }
    setEditingId(null);
    await load();
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    const res = await client.deleteTagWithPolicy(deleteTarget.id, {
      replacementTagId: replaceId || null,
    });
    setDeleting(false);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      setError(res.error.message);
      return;
    }
    setDeleteTarget(null);
    setReplaceId('');
    await load();
  }

  return (
    <div className={styles.wrap}>
      {error ? (
        <p className={styles.err} role="alert">
          {error}
        </p>
      ) : null}

      <form className={styles.createForm} onSubmit={(e) => void onCreate(e)}>
        <h2 className={styles.h2}>New tag</h2>
        <p className={styles.hint}>Key: lowercase letters, numbers, hyphens (e.g. deep-work).</p>
        <div className={styles.row}>
          <label className={styles.label}>
            Key
            <input
              className={styles.input}
              value={createKey}
              onChange={(e) => setCreateKey(e.target.value)}
              required
              maxLength={50}
              pattern="[a-z0-9-]+"
            />
          </label>
          <label className={styles.label}>
            Display name
            <input
              className={styles.input}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label className={styles.label}>
            Color
            <input
              className={styles.color}
              type="color"
              value={createColor}
              onChange={(e) => setCreateColor(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className={styles.primary} disabled={creating}>
          {creating ? 'Creating…' : 'Create tag'}
        </button>
      </form>

      <h2 className={styles.h2}>Your tags</h2>
      {!tags ? <p className={styles.muted}>Loading…</p> : null}
      {tags && tags.length === 0 ? <p className={styles.muted}>No tags yet.</p> : null}
      <ul className={styles.list}>
        {tags?.map((t) => (
          <li key={t.id} className={styles.item}>
            <span className={styles.swatch} style={{ background: t.color ?? '#999' }} aria-hidden />
            {editingId === t.id ? (
              <div className={styles.editBlock}>
                <input className={styles.input} value={editName} onChange={(e) => setEditName(e.target.value)} />
                <input
                  className={styles.color}
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.smallBtn}
                  disabled={busyId === t.id}
                  onClick={() => void saveEdit(t.id)}
                >
                  Save
                </button>
                <button type="button" className={styles.smallBtn} onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className={styles.itemMeta}>
                  <span className={styles.itemKey}>{t.key}</span>
                  <span className={styles.itemName}>{t.displayName}</span>
                </div>
                <div className={styles.itemActions}>
                  <button type="button" className={styles.smallBtn} onClick={() => startEdit(t)}>
                    Edit
                  </button>
                  <button type="button" className={styles.dangerBtn} onClick={() => setDeleteTarget(t)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {deleteTarget ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="del-title">
          <div className={styles.modal}>
            <h3 id="del-title" className={styles.modalTitle}>
              Delete tag “{deleteTarget.displayName}”?
            </h3>
            <p className={styles.modalBody}>
              Tasks using this tag will have it removed, or you can reassign them to another tag first.
            </p>
            {replacementOptions.length > 0 ? (
              <label className={styles.label}>
                Reassign tasks to (optional)
                <select className={styles.select} value={replaceId} onChange={(e) => setReplaceId(e.target.value)}>
                  <option value="">Clear tag on tasks</option>
                  {replacementOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.displayName} ({o.key})
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className={styles.modalActions}>
              <button type="button" className={styles.smallBtn} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                disabled={deleting}
                onClick={() => void confirmDelete()}
              >
                {deleting ? 'Deleting…' : 'Delete tag'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
