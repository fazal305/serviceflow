import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useJobs() {
  const api = useApi();
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => api('/jobs'),
  });
}

export function useJob(id) {
  const api = useApi();
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api(`/jobs/${id}`),
    enabled: !!id,
  });
}

export function useStartJob() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId) => api(`/jobs/${jobId}/start`, { method: 'POST' }),
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
    mutationFn: (jobId) => api(`/jobs/${jobId}/complete`, { method: 'POST' }),
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}

export function useAddJobNote(jobId) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note) =>
      api(`/jobs/${jobId}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}

export function useAddJobPart(jobId) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (part) => api(`/jobs/${jobId}/parts`, { method: 'POST', body: JSON.stringify(part) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}

export function useScheduleRequest() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, scheduledDate, scheduledTime }) =>
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
