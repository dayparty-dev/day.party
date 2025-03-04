import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  function authGuard(element: React.ReactNode) {
    const { isLoggedIn } = useAuth();

    const shouldRedirect = (isLogin && isLoggedIn) || (!isLogin && !isLoggedIn);

    useEffect(() => {
      if (shouldRedirect) {
        router.push(redirectUrl);
      }
    }, [shouldRedirect, redirectUrl, router]);

    return shouldRedirect ? null : element;
  }

  return {
    authGuard,
  };
}
