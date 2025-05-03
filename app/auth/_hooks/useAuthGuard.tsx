import { useRouter } from 'next/navigation';
import { ReactElement, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export interface useAuthGuardArgs {
  redirectUrl?: string;
  isLogin?: boolean;
}

useAuthGuard.DEFAULT_REDIRECT_URL = '/auth/login';

export function useAuthGuard(args: useAuthGuardArgs = {}) {
  const { redirectUrl = useAuthGuard.DEFAULT_REDIRECT_URL, isLogin = false } =
    args;
  const router = useRouter();

  function authGuard(element: ReactElement) {
    const { isLoggedIn } = useAuth();
    const [mounted, setMounted] = useState(false);

    const shouldRedirect = (isLogin && isLoggedIn) || (!isLogin && !isLoggedIn);

    useEffect(() => {
      setMounted(true);

      if (shouldRedirect) {
        router.push(redirectUrl);
      }
    }, [shouldRedirect, redirectUrl, router]);

    // Prevents hydration error by ensuring we only render content on the client
    // after we've confirmed the authentication state
    if (!mounted) {
      return <div style={{ display: 'none' }} />;
    }

    return shouldRedirect ? <div style={{ display: 'none' }} /> : element;
  }

  return {
    authGuard,
  };
}
