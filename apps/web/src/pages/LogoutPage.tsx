import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export function LogoutPage(): ReactElement {
  const { t } = useTranslation();
  const { authReady, logout } = useAuth();

  useEffect(() => {
    if (!authReady) {
      return;
    }
    void logout();
  }, [authReady, logout]);

  return (
    <div className="auth-loading" aria-busy="true" aria-live="polite">
      {t('auth.signingOut')}
    </div>
  );
}
