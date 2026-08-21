import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useServiceRequests(filters) {
  const api = useApi();
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.serviceCategoryId) params.set('serviceCategoryId', filters.serviceCategoryId);
  const qs = params.toString();

  return useQuery({
    queryKey: ['service-requests', filters ?? {}],
    queryFn: () => api(`/service-requests${qs ? `?${qs}` : ''}`),
  });
}

export function useServiceRequest(id) {
  const api = useApi();
  return useQuery({
    queryKey: ['service-requests', id],
    queryFn: () => api(`/service-requests/${id}`),
    enabled: !!id,
  });
}

export function useCreateServiceRequest() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) =>
      api('/service-requests', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    },
  });
}

export function useAssignTechnician() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, technicianId }) =>
      api(`/service-requests/${requestId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ technicianId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
