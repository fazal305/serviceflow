import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
  isNetlify: process.env.NETLIFY === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME),
  // Read lazily via getters below so local `npm run dev` doesn't crash before
  // Phase 1 (DB/Clerk) is wired up — /api/health must work with zero config.
  get databaseUrl() {
    return required('DATABASE_URL');
  },
  get clerkSecretKey() {
    return required('CLERK_SECRET_KEY');
  },
  get openRouterApiKey() {
    return required('OPENROUTER_API_KEY');
  },
  // Non-throwing: the AI assistant must degrade gracefully when unset
  // (Section 12), so callers check this instead of catching a throw.
  get openRouterApiKeyOrNull(): string | null {
    return process.env.OPENROUTER_API_KEY || null;
  },
  openRouterModel: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
  // Realtime is an optional enhancement (Section 17) — when either is
  // unset, broadcasting just no-ops and clients fall back to their
  // existing polling. Never throws.
  get supabaseUrl(): string | null {
    return process.env.SUPABASE_URL || null;
  },
  get supabaseServiceRoleKey(): string | null {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
  },
};
