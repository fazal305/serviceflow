import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useNotifications() {
  const api = useApi();
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api('/notifications'),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  const api = useApi();
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api('/notifications/unread-count'),
    refetchInterval: 30_000,
  });
}

export function useMarkAllNotificationsRead() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
