import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useReportsSummary() {
  const api = useApi();
  return useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => api('/reports/summary'),
  });
}
