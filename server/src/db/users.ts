import { getPool } from './pool.js';

export type UserRole = 'ADMIN' | 'TECHNICIAN' | 'CUSTOMER';

export interface AppUser {
  id: string;
  clerkUserId: string;
  role: UserRole;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserRow {
  id: string;
  clerk_user_id: string;
  role: UserRole;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

function toAppUser(row: UserRow): AppUser {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    role: row.role,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findUserByClerkId(clerkUserId: string): Promise<AppUser | null> {
  const { rows } = await getPool().query<UserRow>(
    'SELECT * FROM users WHERE clerk_user_id = $1',
    [clerkUserId],
  );
  return rows[0] ? toAppUser(rows[0]) : null;
}

export async function createUser(params: {
  clerkUserId: string;
  role: UserRole;
  email: string;
  fullName?: string | null;
}): Promise<AppUser> {
  const { rows } = await getPool().query<UserRow>(
    `INSERT INTO users (clerk_user_id, role, email, full_name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.clerkUserId, params.role, params.email, params.fullName ?? null],
  );
  return toAppUser(rows[0]);
}

export async function updateUserProfile(
  id: string,
  params: { fullName: string | null; phone: string | null },
): Promise<AppUser> {
  const { rows } = await getPool().query<UserRow>(
    `UPDATE users SET full_name = $1, phone = $2, updated_at = now() WHERE id = $3 RETURNING *`,
    [params.fullName, params.phone, id],
  );
  return toAppUser(rows[0]);
}
