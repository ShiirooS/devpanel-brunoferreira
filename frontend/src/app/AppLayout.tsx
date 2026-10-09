import { Outlet } from 'react-router';
import { useAuthStore } from '../features/auth/authStore';
import { ROLE_LABELS } from '../lib/labels';

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-semibold">DevPanel</span>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
