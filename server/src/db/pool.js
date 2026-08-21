import { Pool, types } from 'pg';

import { env } from '../config/env.js';

// Postgres OID 1082 = `date`. `pg` parses this into a JS Date by default,
// which then serializes as a full ISO timestamp (with a timezone-dependent
// day) instead of the plain `YYYY-MM-DD` a DATE column actually means —
// breaking both display formatting and round-tripping into
// `<input type="date">`. Keep it as the raw string Postgres sends.
types.setTypeParser(1082, (value) => value);

let pool;

// Lazily created so the module can be imported (e.g. by config-only code
// paths) without immediately requiring DATABASE_URL to be set.
export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: { rejectUnauthorized: false }, // required for Supabase's pooler
      max: 10,
    });
  }
  return pool;
}
