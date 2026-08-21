import { getPool } from './pool.js';

function toAppUser(row) {
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

export async function findUserByClerkId(clerkUserId) {
  const { rows } = await getPool().query(
    'SELECT * FROM users WHERE clerk_user_id = $1',
    [clerkUserId],
  );
  return rows[0] ? toAppUser(rows[0]) : null;
}

export async function createUser(params) {
  const { rows } = await getPool().query(
    `INSERT INTO users (clerk_user_id, role, email, full_name)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [params.clerkUserId, params.role, params.email, params.fullName ?? null],
  );
  return toAppUser(rows[0]);
}

export async function updateUserProfile(id, params) {
  const { rows } = await getPool().query(
    `UPDATE users SET full_name = $1, phone = $2, updated_at = now() WHERE id = $3 RETURNING *`,
    [params.fullName, params.phone, id],
  );
  return toAppUser(rows[0]);
}
