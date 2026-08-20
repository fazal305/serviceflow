import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useMe } from '../api/me';
import { getSupabaseClient } from '../lib/realtime';

/**
 * Subscribes to this user's private Supabase Realtime channel and
 * invalidates the relevant query caches on any signal, so notifications,
 * dashboards, and lists update live instead of waiting for their next
 * poll. The channel carries no data (see server/src/services/realtime.ts)
 * — this only ever triggers a refetch through the normal authenticated
 * API, never trusts anything from the realtime payload itself.
 *
 * No-ops cleanly if Supabase Realtime isn't configured — every query this
 * would refresh already polls on its own interval regardless.
 */
export function useRealtimeSync() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!me) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    getSupabaseClient().then((client) => {
      if (!client || cancelled) return;

      const channel = client
        .channel(`user:${me.id}`)
        .on('broadcast', { event: 'update' }, () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
          queryClient.invalidateQueries({ queryKey: ['service-requests'] });
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['activity'] });
        })
        .subscribe();

      cleanup = () => {
        client.removeChannel(channel);
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [me, queryClient]);
}
