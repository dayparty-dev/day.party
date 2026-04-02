import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import styles from './HelpShortcutsPage.module.css';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';

export function HelpShortcutsPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.back} to="/rundown">
          {t('common.backToRundown')}
        </Link>
        <h1 className={styles.title}>{t('shortcutsHelp.title')}</h1>
        <p className={styles.lead}>{t('shortcutsHelp.lead')}</p>
      </header>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('shortcutsHelp.colShortcut')}</th>
            <th>{t('shortcutsHelp.colGoesTo')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <kbd>{mod}</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>
            </td>
            <td>{t('shortcutsHelp.rundown')}</td>
          </tr>
          <tr>
            <td>
              <kbd>{mod}</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd>
            </td>
            <td>{t('shortcutsHelp.ongoingFocus')}</td>
          </tr>
          <tr>
            <td>
              <kbd>{mod}</kbd> + <kbd>Shift</kbd> + <kbd>W</kbd>
            </td>
            <td>{t('shortcutsHelp.rewards')}</td>
          </tr>
          <tr>
            <td>
              <kbd>{mod}</kbd> + <kbd>Shift</kbd> + <kbd>/</kbd>
            </td>
            <td>{t('shortcutsHelp.thisPage')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
