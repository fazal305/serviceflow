import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useRequestInvoice(requestId) {
  const api = useApi();
  return useQuery({
    queryKey: ['service-requests', requestId, 'invoice'],
    queryFn: () => api(`/service-requests/${requestId}/invoice`),
    enabled: !!requestId,
  });
}

export function useCreateInvoice(requestId) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quotationId, dueDate }) =>
      api(`/quotations/${quotationId}/invoice`, {
        method: 'POST',
        body: JSON.stringify({ dueDate }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useInvoices(status) {
  const api = useApi();
  return useQuery({
    queryKey: ['invoices', status ?? ''],
    queryFn: () => api(`/invoices${status ? `?status=${status}` : ''}`),
  });
}

export function useInvoice(id) {
  const api = useApi();
  return useQuery({
    queryKey: ['invoices', 'detail', id],
    queryFn: () => api(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useRecordPayment(invoiceId, requestId) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payment) =>
      api(`/invoices/${invoiceId}/payments`, {
        method: 'POST',
        body: JSON.stringify(payment),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (requestId) queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] });
    },
  });
}
