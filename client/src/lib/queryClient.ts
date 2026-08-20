import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // Don't defer to the browser's navigator.onLine — it's unreliable
      // behind proxies/automated environments and would otherwise leave
      // queries stuck in a "paused" state despite the network being fine.
      networkMode: 'always',
    },
  },
});
