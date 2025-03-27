'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

import { useAuth } from '../_hooks/useAuth';
import { saveTasksToStorage } from 'app/_hooks/useTasks';

function LogoutComponent() {
  const { logout } = useAuth();
  const router = useRouter();

  function clearTasks() {
    saveTasksToStorage({});
  }

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Error during logout:', error);
      }

      clearTasks();
      router.push('/auth/login');
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
