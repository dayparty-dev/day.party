import { useContext, type ContextType } from 'react';
import { AuthContext } from '../context/auth-context';

export function useAuth(): NonNullable<ContextType<typeof AuthContext>> {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
