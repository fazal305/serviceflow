import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

export interface ActivityLogEntry {
  id: string;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function useActivity() {
  const api = useApi();
  return useQuery({
    queryKey: ['activity'],
    queryFn: () => api<ActivityLogEntry[]>('/activity'),
  });
}
