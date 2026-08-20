import { Pool } from 'pg';

import { env } from '../config/env.js';

let pool: Pool | undefined;

// Lazily created so the module can be imported (e.g. by config-only code
// paths) without immediately requiring DATABASE_URL to be set.
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: { rejectUnauthorized: false }, // required for Supabase's pooler
      max: 10,
    });
  }
  return pool;
}
