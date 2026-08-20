import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export interface Customer {
  id: string;
  userId: string;
  address: string | null;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
}

export function useCustomers(search?: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['customers', search ?? ''],
    queryFn: () => api<Customer[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });
}
