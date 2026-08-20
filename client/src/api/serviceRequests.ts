import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './useApi';

export type ServiceRequestStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_APPROVAL'
  | 'QUOTATION_APPROVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string;
  serviceCategoryId: string | null;
  serviceCategoryName: string | null;
  description: string;
  status: ServiceRequestStatus;
  priority: Priority;
  preferredDate: string | null;
  preferredTime: string | null;
  address: string;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
  technicianId: string | null;
  technicianName: string | null;
}

export interface CreateServiceRequestInput {
  serviceCategoryId: string | null;
  description: string;
  priority: Priority;
  preferredDate: string | null;
  preferredTime: string | null;
  address: string;
  contactPhone: string | null;
}

export function useServiceRequests(filters?: { status?: ServiceRequestStatus; serviceCategoryId?: string }) {
  const api = useApi();
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.serviceCategoryId) params.set('serviceCategoryId', filters.serviceCategoryId);
  const qs = params.toString();

  return useQuery({
    queryKey: ['service-requests', filters ?? {}],
    queryFn: () => api<ServiceRequest[]>(`/service-requests${qs ? `?${qs}` : ''}`),
  });
}

export function useServiceRequest(id: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: ['service-requests', id],
    queryFn: () => api<ServiceRequest>(`/service-requests/${id}`),
    enabled: !!id,
  });
}

export function useCreateServiceRequest() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServiceRequestInput) =>
      api<ServiceRequest>('/service-requests', {
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
    mutationFn: ({ requestId, technicianId }: { requestId: string; technicianId: string }) =>
      api<ServiceRequest>(`/service-requests/${requestId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ technicianId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
