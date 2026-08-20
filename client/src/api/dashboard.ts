import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export interface DashboardSummary {
  openRequests: number;
  pendingAssignment: number;
  activeTechnicians: number;
  totalCustomers: number;
  statusBreakdown: Array<{ status: string; count: number }>;
}

export function useDashboardSummary() {
  const api = useApi();
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api<DashboardSummary>('/dashboard/summary'),
  });
}
