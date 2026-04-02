import type { ReactElement } from 'react';
import { Link, Navigate, Outlet } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import styles from './admin-shared.module.css';

export function AdminLayout(): ReactElement {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/rundown" replace />;
  }
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <Link to="/admin">Users</Link>
        <Link to="/admin/audit">Audit log</Link>
        <Link to="/admin/feedback">Feedback</Link>
        <Link to="/rundown">Back to rundown</Link>
      </header>
      <Outlet />
    </div>
  );
}
