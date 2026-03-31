'use client';

import { useAuth } from '../_hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthGuard } from '../_hooks/useAuthGuard';
import { Suspense } from 'react';

function LoginForm() {
  const { sendLoginLink, verifyLoginLink } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { authGuard } = useAuthGuard({
    isLogin: true,
    redirectUrl: '/rundown',
  });

  useEffect(() => {
    if (sessionId) {
      verifyLoginLink(sessionId).catch((error) => {
        console.error('Failed to verify session:', error);
      });
    }
  }, [sessionId, verifyLoginLink]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const email = formData.get('email') as string;
    sendLoginLink(email);
  };

  return authGuard(
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" />
        <button type="submit">Send login link</button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
