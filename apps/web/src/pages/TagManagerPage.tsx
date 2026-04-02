import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { TagManagerPanel } from '../components/TagManagerPanel';
import styles from './TagManagerPage.module.css';

export function TagManagerPage(): ReactElement {
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link className={styles.back} to="/rundown">
          ← Rundown
        </Link>
        <h1 className={styles.title}>Tags</h1>
      </header>
      <TagManagerPanel />
    </div>
  );
}
