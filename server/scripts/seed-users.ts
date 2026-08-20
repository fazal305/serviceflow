/**
 * Development-only seed script: creates one real Clerk account per role
 * (ADMIN / TECHNICIAN / CUSTOMER) and the matching row in our `users`
 * table, so the whole app can be tested end-to-end without hand-creating
 * accounts through the sign-up form for every role.
 *
 * NOT for production use — run manually against your dev Clerk instance:
 *
 *   npm run seed:users --workspace server
 *
 * Requires server/.env to have real CLERK_SECRET_KEY and DATABASE_URL.
 */
import { clerkClient } from '@clerk/express';

import { env } from '../src/config/env.js';
import { getPool } from '../src/db/pool.js';
import type { UserRole } from '../src/db/users.js';

// Obviously-a-placeholder credentials, dev-only — never used in production.
const DEV_PASSWORD = 'ServiceFlow#Dev1';

// The `+clerk_test` local-part is Clerk's documented test-email pattern:
// https://clerk.com/docs/testing/test-emails-and-phones — Clerk never sends
// real mail to these addresses and accepts the fixed OTP `424242` for any
// email-verification step, which is what makes these accounts usable
// without access to a real inbox for a domain we don't own.
const SEED_ACCOUNTS: Array<{
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
}> = [
  { role: 'ADMIN', email: 'admin+clerk_test@serviceflow.dev', firstName: 'Dev', lastName: 'Admin' },
  { role: 'TECHNICIAN', email: 'technician+clerk_test@serviceflow.dev', firstName: 'Dev', lastName: 'Technician' },
  { role: 'CUSTOMER', email: 'customer+clerk_test@serviceflow.dev', firstName: 'Dev', lastName: 'Customer' },
];

async function findExistingClerkUser(email: string) {
  const { data } = await clerkClient.users.getUserList({ emailAddress: [email] });
  return data[0] ?? null;
}

async function upsertDbUser(clerkUserId: string, role: UserRole, email: string, fullName: string) {
  await getPool().query(
    `INSERT INTO users (clerk_user_id, role, email, full_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clerk_user_id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email`,
    [clerkUserId, role, email, fullName],
  );
}

async function main() {
  // Touch env now so a missing var fails loudly before any Clerk/DB calls.
  void env.databaseUrl;
  void env.clerkSecretKey;

  for (const account of SEED_ACCOUNTS) {
    let clerkUser = await findExistingClerkUser(account.email);

    if (!clerkUser) {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [account.email],
        username: `${account.role.toLowerCase()}_serviceflow`,
        password: DEV_PASSWORD,
        firstName: account.firstName,
        lastName: account.lastName,
        publicMetadata: { role: account.role },
        skipPasswordChecks: false,
      });
      console.log(`Created Clerk user for ${account.role}: ${account.email}`);
    } else {
      await clerkClient.users.updateUserMetadata(clerkUser.id, {
        publicMetadata: { role: account.role },
      });
      console.log(`Clerk user already existed for ${account.role}: ${account.email} (metadata refreshed)`);
    }

    await upsertDbUser(clerkUser.id, account.role, account.email, `${account.firstName} ${account.lastName}`);
  }

  console.log('\nSeeded development test accounts (password for all: ' + DEV_PASSWORD + ')');
  await getPool().end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
