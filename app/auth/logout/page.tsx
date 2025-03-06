'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_hooks/useAuth';
import { Suspense } from 'react';

function LogoutComponent() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
        router.push('/auth/login');
      } catch (error) {
        console.error('Error during logout:', error);
        router.push('/auth/login');
      }
    };

    handleLogout();
  }, [logout, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Logging out...</p>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogoutComponent />
    </Suspense>
  );
}
