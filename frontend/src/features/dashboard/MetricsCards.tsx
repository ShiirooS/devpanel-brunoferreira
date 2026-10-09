import { isCancel } from 'axios';
import { useEffect, useState, type ReactNode } from 'react';
import { ROLE_LABELS } from '../../lib/labels';
import { useCountUp } from '../../lib/useCountUp';
import type { DashboardMetrics, Role } from '../../types/api';
import { fetchMetrics } from './dashboardApi';

const ROLES: Role[] = ['ADMIN', 'EDITOR', 'VIEWER'];
const CARD = 'rounded-2xl border border-neutral-200 bg-white p-5 animate-fade-up';

function StatCard({ label, value, hint, index }: { label: string; value: number; hint?: string; index: number }) {
  const shown = useCountUp(value);
  return (
    <div className={CARD} style={{ animationDelay: `${index * 70}ms` }}>
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold tabular-nums tracking-tight">{shown}</p>
      {hint && <p className="mt-1 text-sm text-neutral-500">{hint}</p>}
    </div>
  );
}

function RoleCard({ byRole, total, index }: { byRole: Record<Role, number>; total: number; index: number }) {
  return (
    <div className={CARD} style={{ animationDelay: `${index * 70}ms` }}>
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Por rol</p>
      <dl className="mt-4 space-y-3">
        {ROLES.map((role) => (
          <div key={role}>
            <div className="flex justify-between text-sm">
              <dt className="text-neutral-600">{ROLE_LABELS[role]}</dt>
              <dd className="font-medium tabular-nums">{byRole[role]}</dd>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full origin-left rounded-full bg-neutral-900 animate-grow-x"
                style={{ width: `${total > 0 ? (byRole[role] / total) * 100 : 0}%`, animationDelay: `${300 + index * 70}ms` }}
              />
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Shell({ children, busy }: { children: ReactNode; busy?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy={busy}>
      {children}
    </div>
  );
}

export function MetricsCards() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchMetrics(controller.signal)
      .then(setMetrics)
      .catch((fetchError: unknown) => {
        if (!isCancel(fetchError)) setError(true);
      });
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <p role="alert" className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
        No se pudieron cargar las métricas.
      </p>
    );
  }

  if (!metrics) {
    return (
      <Shell busy>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-neutral-200/60" />
        ))}
      </Shell>
    );
  }

  const activeShare = metrics.totalUsers > 0 ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100) : 0;

  return (
    <Shell>
      <StatCard index={0} label="Usuarios" value={metrics.totalUsers} hint="Total registrados" />
      <StatCard index={1} label="Activos" value={metrics.activeUsers} hint={`${activeShare}% del total`} />
      <StatCard index={2} label="Nuevos" value={metrics.newUsersLast30Days} hint="Últimos 30 días" />
      <RoleCard index={3} byRole={metrics.byRole} total={metrics.totalUsers} />
    </Shell>
  );
}
