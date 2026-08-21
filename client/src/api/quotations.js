import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useRequestQuotation(requestId) {
  const api = useApi();
  return useQuery({
    queryKey: ['service-requests', requestId, 'quotation'],
    queryFn: () => api(`/service-requests/${requestId}/quotation`),
    enabled: !!requestId,
  });
}

export function useCreateQuotation(requestId) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) =>
      api(`/service-requests/${requestId}/quotations`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] });
    },
  });
}

export function useApproveQuotation(requestId) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quotationId) => api(`/quotations/${quotationId}/approve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] });
    },
  });
}

export function useRejectQuotation(requestId) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quotationId) => api(`/quotations/${quotationId}/reject`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] });
    },
  });
}
