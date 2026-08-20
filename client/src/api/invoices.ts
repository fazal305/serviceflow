import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { LineItemType } from './quotations';
import { useApi } from './useApi';

export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'ONLINE';

export interface InvoiceItem {
  id: string;
  type: LineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  amount: string;
  method: PaymentMethod;
  notes: string | null;
  paidAt: string;
  recordedByName: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId: string;
  serviceRequestId: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string;
  status: InvoiceStatus;
  isOverdue: boolean;
  subtotal: string;
  taxRate: string;
  discountAmount: string;
  total: string;
  amountPaid: string;
  dueDate: string | null;
  createdAt: string;
  items: InvoiceItem[];
  payments: Payment[];
}

export function useRequestInvoice(requestId: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: ['service-requests', requestId, 'invoice'],
    queryFn: () => api<Invoice | null>(`/service-requests/${requestId}/invoice`),
    enabled: !!requestId,
  });
}

export function useCreateInvoice(requestId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quotationId, dueDate }: { quotationId: string; dueDate: string | null }) =>
      api<Invoice>(`/quotations/${quotationId}/invoice`, {
        method: 'POST',
        body: JSON.stringify({ dueDate }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useInvoices(status?: InvoiceStatus) {
  const api = useApi();
  return useQuery({
    queryKey: ['invoices', status ?? ''],
    queryFn: () => api<Invoice[]>(`/invoices${status ? `?status=${status}` : ''}`),
  });
}

export function useInvoice(id: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: ['invoices', 'detail', id],
    queryFn: () => api<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useRecordPayment(invoiceId: string, requestId?: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payment: { amount: number; method: PaymentMethod; notes: string | null }) =>
      api<Invoice>(`/invoices/${invoiceId}/payments`, {
        method: 'POST',
        body: JSON.stringify(payment),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (requestId) queryClient.invalidateQueries({ queryKey: ['service-requests', requestId] });
    },
  });
}
