import { MetricsCards } from './MetricsCards';

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <MetricsCards />
      </section>
    </div>
  );
}
