import { isCancel } from 'axios';
import { useEffect, useState, type ReactNode } from 'react';
import { ROLE_LABELS } from '../../lib/labels';
import type { DashboardMetrics, Role } from '../../types/api';
import { fetchMetrics } from './dashboardApi';

const ROLES: Role[] = ['ADMIN', 'EDITOR', 'VIEWER'];

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Value({ children }: { children: ReactNode }) {
  return <p className="text-3xl font-semibold tabular-nums text-slate-900">{children}</p>;
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
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
        No se pudieron cargar las métricas.
      </p>
    );
  }

  if (!metrics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    );
  }

  const activeShare =
    metrics.totalUsers > 0 ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Usuarios totales">
        <Value>{metrics.totalUsers}</Value>
      </Card>
      <Card label="Usuarios activos">
        <Value>{metrics.activeUsers}</Value>
        <p className="mt-1 text-sm text-slate-500">{activeShare}% del total</p>
      </Card>
      <Card label="Nuevos (últimos 30 días)">
        <Value>{metrics.newUsersLast30Days}</Value>
      </Card>
      <Card label="Usuarios por rol">
        <dl className="space-y-1 text-sm">
          {ROLES.map((role) => (
            <div key={role} className="flex justify-between">
              <dt className="text-slate-600">{ROLE_LABELS[role]}</dt>
              <dd className="font-semibold tabular-nums text-slate-900">{metrics.byRole[role]}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
