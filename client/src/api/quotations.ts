import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './useApi';

export type LineItemType = 'LABOR' | 'PART';
export type QuotationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface QuotationItem {
  id: string;
  type: LineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quotation {
  id: string;
  serviceRequestId: string;
  status: QuotationStatus;
  subtotal: string;
  taxRate: string;
  discountAmount: string;
  total: string;
  notes: string | null;
  validUntil: string | null;
  decidedAt: string | null;
  createdAt: string;
  items: QuotationItem[];
}

export interface CreateQuotationInput {
  items: Array<{ type: LineItemType; description: string; quantity: number; unitPrice: number }>;
  taxRate: number;
  discountAmount: number;
  notes: string | null;
  validUntil: string | null;
}

export function useRequestQuotation(requestId: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: ['service-requests', requestId, 'quotation'],
    queryFn: () => api<Quotation | null>(`/service-requests/${requestId}/quotation`),
    enabled: !!requestId,
  });
}

export function useCreateQuotation(requestId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuotationInput) =>
      api<Quotation>(`/service-requests/${requestId}/quotations`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] });
    },
  });
}

export function useApproveQuotation(requestId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quotationId: string) => api<Quotation>(`/quotations/${quotationId}/approve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] });
    },
  });
}

export function useRejectQuotation(requestId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quotationId: string) => api<Quotation>(`/quotations/${quotationId}/reject`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] });
    },
  });
}
