import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

import { apiFetch } from './http';

export function useApi() {
  const { getToken } = useAuth();

  return useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const token = await getToken();
      return apiFetch<T>(path, token, init);
    },
    [getToken],
  );
}
