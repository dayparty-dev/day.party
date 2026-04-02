import type { ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { LogoutPage } from './pages/LogoutPage';
import { OngoingPage } from './pages/OngoingPage';
import { RewardsPage } from './pages/RewardsPage';
import { RundownPage } from './pages/RundownPage';
import { VisualPresetProvider } from './context/visual-preset-context';

function AuthBootSpinner(): ReactElement {
  return (
    <div className="auth-loading" aria-busy="true" aria-live="polite">
      Loading…
    </div>
  );
}

function ProtectedLayout(): ReactElement {
  const { authReady, isAuthenticated } = useAuth();
  if (!authReady) {
    return <AuthBootSpinner />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <VisualPresetProvider>
      <Outlet />
    </VisualPresetProvider>
  );
}

function RootRedirect(): ReactElement {
  const { authReady, isAuthenticated } = useAuth();
  if (!authReady) {
    return <AuthBootSpinner />;
  }
  return <Navigate to={isAuthenticated ? '/rundown' : '/login'} replace />;
}

export function App(): ReactElement {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/rundown" element={<RundownPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/ongoing" element={<OngoingPage />} />
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
