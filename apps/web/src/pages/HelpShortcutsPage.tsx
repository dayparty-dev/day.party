import type { ReactElement } from 'react';
import { Link } from 'react-router';
import styles from './HelpShortcutsPage.module.css';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';

export function HelpShortcutsPage(): ReactElement {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.back} to="/rundown">
          ← Rundown
        </Link>
        <h1 className={styles.title}>Keyboard shortcuts</h1>
        <p className={styles.lead}>These work when you are not typing in a field (inputs, text areas, or selects).</p>
      </header>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Goes to</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <kbd>{mod}</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>
            </td>
            <td>Rundown (planner)</td>
          </tr>
          <tr>
            <td>
              <kbd>{mod}</kbd> + <kbd>Shift</kbd> + <kbd>O</kbd>
            </td>
            <td>Ongoing (focus)</td>
          </tr>
          <tr>
            <td>
              <kbd>{mod}</kbd> + <kbd>Shift</kbd> + <kbd>W</kbd>
            </td>
            <td>Rewards</td>
          </tr>
          <tr>
            <td>
              <kbd>{mod}</kbd> + <kbd>Shift</kbd> + <kbd>/</kbd>
            </td>
            <td>This help page</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
