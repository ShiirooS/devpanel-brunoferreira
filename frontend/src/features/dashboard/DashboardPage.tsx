import { UsersSection } from '../users/UsersSection';
import { MetricsCards } from './MetricsCards';

export function DashboardPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
          <p className="mt-1 text-sm text-neutral-500">Resumen de usuarios y actividad reciente.</p>
        </div>
        <MetricsCards />
      </section>
      <UsersSection />
    </div>
  );
}
