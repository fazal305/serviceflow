import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '../config/env.js';

let client: SupabaseClient | null | undefined;

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    client = null;
    return client;
  }

  // Service-role key: server-only, bypasses RLS. Never send this to the
  // browser — the frontend uses the anon key instead (see client/src/lib/realtime.ts).
  client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
}

/**
 * Pushes a content-free "something changed" signal to one user's private
 * channel. Deliberately carries no data — real data always comes from our
 * own authenticated REST API. This means a guessed/leaked channel name
 * exposes nothing beyond "this user should refetch something", which is
 * why per-user channels don't need Postgres RLS to be safe.
 *
 * Best-effort: realtime is an enhancement (Section 17), never a
 * requirement, so a failure here is logged and swallowed rather than
 * bubbled up to fail the request that triggered it.
 */
export async function broadcastToUser(userId: string, kind: string): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;

  try {
    const channel = supabase.channel(`user:${userId}`);
    await channel.send({ type: 'broadcast', event: 'update', payload: { kind } });
    await supabase.removeChannel(channel);
  } catch (err) {
    console.error('Realtime broadcast failed (non-fatal):', err);
  }
}
