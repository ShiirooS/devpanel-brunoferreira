import { http } from '../../lib/http';
import type { DashboardMetrics } from '../../types/api';

export async function fetchMetrics(signal: AbortSignal): Promise<DashboardMetrics> {
  const { data } = await http.get<DashboardMetrics>('/dashboard/metrics', { signal });
  return data;
}
