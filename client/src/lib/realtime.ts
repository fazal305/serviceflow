import type { SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Both unset (or left as the .env.example placeholders) is a supported,
// fully-functional state — realtime is an enhancement, not a requirement
// (Section 17), and the app falls back to each query's normal polling.
const isConfigured = !!url && !!anonKey && !url.includes('REPLACE_ME') && !anonKey.includes('REPLACE_ME');

let clientPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Dynamically imports @supabase/supabase-js only when Realtime is
 * actually configured — this library is ~200KB and would otherwise sit in
 * every authenticated user's bundle even when unused, since this is
 * wired up from ProtectedRoute (mounted for every role).
 */
export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!isConfigured) return Promise.resolve(null);

  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(url, anonKey));
  }
  return clientPromise;
}
