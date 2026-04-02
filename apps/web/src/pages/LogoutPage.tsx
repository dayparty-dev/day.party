import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export function LogoutPage(): ReactElement {
  const { authReady, logout } = useAuth();

  useEffect(() => {
    if (!authReady) {
      return;
    }
    void logout();
  }, [authReady, logout]);

  return (
    <div className="auth-loading" aria-busy="true" aria-live="polite">
      Signing out…
    </div>
  );
}
