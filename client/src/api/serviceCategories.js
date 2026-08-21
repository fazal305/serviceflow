import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useServiceCategories() {
  const api = useApi();
  return useQuery({
    queryKey: ['service-categories'],
    queryFn: () => api('/service-categories'),
  });
}
