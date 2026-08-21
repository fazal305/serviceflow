import { getPool } from './pool.js';

function toCustomer(row) {
  return {
    id: row.id,
    userId: row.user_id,
    address: row.address,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    createdAt: row.created_at,
  };
}

export async function findOrCreateCustomerByUserId(userId) {
  const { rows } = await getPool().query(
    `WITH inserted AS (
       INSERT INTO customers (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING id, user_id, address, created_at
     )
     SELECT c.id, c.user_id, c.address, c.created_at, u.email, u.full_name, u.phone
     FROM customers c
     JOIN users u ON u.id = c.user_id
     WHERE c.user_id = $1`,
    [userId],
  );
  return toCustomer(rows[0]);
}

export async function listCustomers(search) {
  const { rows } = await getPool().query(
    `SELECT c.id, c.user_id, c.address, c.created_at, u.email, u.full_name, u.phone
     FROM customers c
     JOIN users u ON u.id = c.user_id
     WHERE $1::text IS NULL OR u.email ILIKE '%' || $1 || '%' OR u.full_name ILIKE '%' || $1 || '%'
     ORDER BY c.created_at DESC`,
    [search ?? null],
  );
  return rows.map(toCustomer);
}

export async function updateCustomerAddress(userId, address) {
  await getPool().query(
    `INSERT INTO customers (user_id, address) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET address = EXCLUDED.address, updated_at = now()`,
    [userId, address],
  );
}

export async function getCustomerById(id) {
  const { rows } = await getPool().query(
    `SELECT c.id, c.user_id, c.address, c.created_at, u.email, u.full_name, u.phone
     FROM customers c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [id],
  );
  return rows[0] ? toCustomer(rows[0]) : null;
}
