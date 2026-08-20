import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Priority, ServiceRequestStatus } from './serviceRequests';
import { useApi } from './useApi';

export interface Job {
  id: string;
  serviceRequestId: string;
  scheduledDate: string;
  scheduledTime: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: ServiceRequestStatus;
  description: string;
  priority: Priority;
  address: string;
  contactPhone: string | null;
  serviceCategoryName: string | null;
  customerName: string | null;
  customerEmail: string;
  technicianId: string;
  technicianName: string | null;
}

export interface JobNote {
  id: string;
  note: string;
  authorName: string | null;
  createdAt: string;
}

export interface JobPart {
  id: string;
  name: string;
  quantity: number;
  unitCost: string | null;
  createdAt: string;
}

export interface JobDetail extends Job {
  notes: JobNote[];
  parts: JobPart[];
}

export function useJobs() {
  const api = useApi();
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => api<Job[]>('/jobs'),
  });
}

export function useJob(id: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api<JobDetail>(`/jobs/${id}`),
    enabled: !!id,
  });
}

export function useStartJob() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api<Job>(`/jobs/${jobId}/start`, { method: 'POST' }),
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}

export function useCompleteJob() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api<Job>(`/jobs/${jobId}/complete`, { method: 'POST' }),
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}

export function useAddJobNote(jobId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: string) =>
      api<JobNote>(`/jobs/${jobId}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}

export function useAddJobPart(jobId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (part: { name: string; quantity: number; unitCost: number | null }) =>
      api<JobPart>(`/jobs/${jobId}/parts`, { method: 'POST', body: JSON.stringify(part) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}

export function useScheduleRequest() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      scheduledDate,
      scheduledTime,
    }: {
      requestId: string;
      scheduledDate: string;
      scheduledTime: string | null;
    }) =>
      api(`/service-requests/${requestId}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduledDate, scheduledTime }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
