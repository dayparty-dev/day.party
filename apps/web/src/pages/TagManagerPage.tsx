import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { TagManagerPanel } from '../components/TagManagerPanel';
import styles from './TagManagerPage.module.css';

export function TagManagerPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.back} to="/rundown">
          {t('common.backToRundown')}
        </Link>
        <h1 className={styles.title}>{t('common.tags')}</h1>
      </header>
      <TagManagerPanel />
    </div>
  );
}
