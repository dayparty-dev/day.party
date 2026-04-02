import type { ReactElement } from 'react';
import { Link, Navigate, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import styles from './admin-shared.module.css';

export function AdminLayout(): ReactElement {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/rundown" replace />;
  }
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <Link to="/admin">{t('admin.users')}</Link>
        <Link to="/admin/audit">{t('admin.auditLog')}</Link>
        <Link to="/admin/feedback">{t('admin.feedback')}</Link>
        <Link to="/rundown">{t('admin.backRundown')}</Link>
      </header>
      <Outlet />
    </div>
  );
}
