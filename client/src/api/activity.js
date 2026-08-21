import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useActivity() {
  const api = useApi();
  return useQuery({
    queryKey: ['activity'],
    queryFn: () => api('/activity'),
  });
}
