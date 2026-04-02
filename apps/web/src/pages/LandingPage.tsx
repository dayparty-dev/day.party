import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import styles from './LandingPage.module.css';

export function LandingPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <main className={styles.layout}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{t('landing.title')}</h1>
        <p className={styles.lead}>{t('landing.lead')}</p>
        <Link className={styles.cta} to="/login">
          {t('landing.cta')}
        </Link>
        <p className={styles.secondary}>{t('landing.secondary')}</p>
      </div>
    </main>
  );
}
