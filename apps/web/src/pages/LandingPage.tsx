import type { ReactElement } from 'react';
import { Link } from 'react-router';
import styles from './LandingPage.module.css';

export function LandingPage(): ReactElement {
  return (
    <main className={styles.layout}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Plan your day, stay in flow</h1>
        <p className={styles.lead}>
          day.party helps you line up what matters, work through it with focus, and keep rewards and history in one calm
          place—without losing the thread between planning and doing.
        </p>
        <Link className={styles.cta} to="/login">
          Sign in to get started
        </Link>
        <p className={styles.secondary}>
          Already use magic links? You’ll pick up right where you left off after sign-in.
        </p>
      </div>
    </main>
  );
}
