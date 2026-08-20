import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export interface ReportsSummary {
  revenueByMonth: Array<{ month: string; revenue: number }>;
  completedJobs: number;
  jobsByTechnician: Array<{ technician: string; count: number }>;
  jobsByCategory: Array<{ category: string; count: number }>;
  pendingPaymentsTotal: number;
  avgCompletionDays: number | null;
}

export function useReportsSummary() {
  const api = useApi();
  return useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => api<ReportsSummary>('/reports/summary'),
  });
}
