import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export function useServiceCategories() {
  const api = useApi();
  return useQuery({
    queryKey: ['service-categories'],
    queryFn: () => api<ServiceCategory[]>('/service-categories'),
  });
}
