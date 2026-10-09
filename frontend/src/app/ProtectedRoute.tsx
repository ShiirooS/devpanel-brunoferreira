import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../features/auth/authStore';

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status !== 'authenticated') {
    // Remember where the user was going so the login can send them back.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
