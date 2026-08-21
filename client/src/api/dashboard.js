import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useDashboardSummary() {
  const api = useApi();
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api('/dashboard/summary'),
  });
}
