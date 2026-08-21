import { useMutation } from '@tanstack/react-query';

import { useApi } from './useApi';

export function useClassifyDescription() {
  const api = useApi();
  return useMutation({
    mutationFn: (description) =>
      api('/ai/classify', {
        method: 'POST',
        body: JSON.stringify({ description }),
      }),
  });
}
