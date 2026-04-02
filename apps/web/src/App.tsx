import type { ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { LogoutPage } from './pages/LogoutPage';
import { OngoingPage } from './pages/OngoingPage';
import { RewardsPage } from './pages/RewardsPage';
import { RundownPage } from './pages/RundownPage';
import { TagManagerPage } from './pages/TagManagerPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminFeedbackPage } from './pages/admin/AdminFeedbackPage';
import { AdminHomePage } from './pages/admin/AdminHomePage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
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

/** Logged-out `/` shows marketing; authed users go straight to the planner. */
function HomeRoute(): ReactElement {
  const { authReady, isAuthenticated } = useAuth();
  if (!authReady) {
    return <AuthBootSpinner />;
  }
  if (isAuthenticated) {
    return <Navigate to="/rundown" replace />;
  }
  return <LandingPage />;
}

function WildcardRoute(): ReactElement {
  const { authReady, isAuthenticated } = useAuth();
  if (!authReady) {
    return <AuthBootSpinner />;
  }
  if (isAuthenticated) {
    return <Navigate to="/rundown" replace />;
  }
  return <Navigate to="/" replace />;
}

export function App(): ReactElement {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/rundown" element={<RundownPage />} />
        <Route path="/tags" element={<TagManagerPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHomePage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="feedback" element={<AdminFeedbackPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
        </Route>
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/ongoing" element={<OngoingPage />} />
      </Route>
      <Route path="/" element={<HomeRoute />} />
      <Route path="*" element={<WildcardRoute />} />
    </Routes>
  );
}
