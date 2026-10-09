import { useAuthStore } from '../auth/authStore';
import { UsersSection } from '../users/UsersSection';
import { MetricsCards } from './MetricsCards';

export function DashboardPage() {
  // VIEWER only sees the dashboard: the API answers 403 on /users for that role.
  const canSeeUsers = useAuthStore((state) => state.user?.role !== 'VIEWER');

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
          <p className="mt-1 text-sm text-neutral-500">Resumen de usuarios y actividad reciente.</p>
        </div>
        <MetricsCards />
      </section>
      {canSeeUsers && <UsersSection />}
    </div>
  );
}
