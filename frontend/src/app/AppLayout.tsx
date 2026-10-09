import { Outlet } from 'react-router';
import { useAuthStore } from '../features/auth/authStore';
import { ROLE_LABELS } from '../lib/labels';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-neutral-900 text-xs font-semibold text-white">D</span>
            <span className="font-semibold tracking-tight">DevPanel</span>
          </div>
          {user && (
            <div className="flex items-center gap-3 animate-fade-in">
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200"
              >
                {initials(user.name)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-neutral-500">{ROLE_LABELS[user.role]}</p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
