import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useTechnicians() {
  const api = useApi();
  return useQuery({
    queryKey: ['technicians'],
    queryFn: () => api('/technicians'),
  });
}

export function useCreateTechnician() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) =>
      api('/technicians', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
