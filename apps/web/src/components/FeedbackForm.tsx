import { ERROR_CODES } from '@dayparty/core';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { isLikelyNetworkFailure } from '../utils/network-error';
import styles from './FeedbackForm.module.css';

export function FeedbackForm(): ReactElement {
  const { t } = useTranslation();
  const { client, onUnauthorized } = useAuth();
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<string>('');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    const res = await client.submitFeedback({
      message: message.trim(),
      category: category === '' ? undefined : (category as 'bug' | 'idea' | 'other'),
    });
    setSaving(false);
    if (!res.ok) {
      if (res.error.code === ERROR_CODES.UNAUTHORIZED) {
        onUnauthorized();
        return;
      }
      if (isLikelyNetworkFailure(res.error)) {
        toast.error(res.error.message);
        return;
      }
      toast.error(res.error.message);
      return;
    }
    toast.success(t('feedback.thanks'));
    setMessage('');
    setCategory('');
  }

  return (
    <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
      <label className={styles.label}>
        {t('feedback.message')}
        <textarea
          className={styles.textarea}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          maxLength={8000}
        />
      </label>
      <label className={styles.label}>
        {t('feedback.categoryOptional')}
        <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">—</option>
          <option value="bug">{t('feedback.catBug')}</option>
          <option value="idea">{t('feedback.catIdea')}</option>
          <option value="other">{t('feedback.catOther')}</option>
        </select>
      </label>
      <button type="submit" className={styles.btn} disabled={saving}>
        {saving ? t('feedback.sending') : t('feedback.send')}
      </button>
    </form>
  );
}
