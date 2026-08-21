import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

import { apiFetch } from './http';

export function useApi() {
  const { getToken } = useAuth();

  return useCallback(
    async (path, init) => {
      const token = await getToken();
      return apiFetch(path, token, init);
    },
    [getToken],
  );
}
