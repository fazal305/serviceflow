import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useCustomers(search) {
  const api = useApi();
  return useQuery({
    queryKey: ['customers', search ?? ''],
    queryFn: () => api(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });
}
