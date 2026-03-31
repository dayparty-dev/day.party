import type { ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { OngoingPage } from './pages/OngoingPage';
import { RundownPage } from './pages/RundownPage';

function ProtectedLayout(): ReactElement {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function RootRedirect(): ReactElement {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/rundown' : '/login'} replace />;
}

export function App(): ReactElement {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/rundown" element={<RundownPage />} />
        <Route path="/ongoing" element={<OngoingPage />} />
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
