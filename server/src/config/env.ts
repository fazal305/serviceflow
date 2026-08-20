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
};
