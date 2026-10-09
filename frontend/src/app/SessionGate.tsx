import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { useAuthStore } from '../features/auth/authStore';

// Root route: asks the API once whether the session cookie is still valid
// and holds every page until it knows, so a reload never flashes /login.
export function SessionGate() {
  const status = useAuthStore((state) => state.status);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (status === 'unknown') {
    return (
      <div className="grid min-h-screen place-items-center" role="status" aria-label="Cargando sesión">
        <span className="size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    );
  }

  return <Outlet />;
}
