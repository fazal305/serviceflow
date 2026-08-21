import { getPool } from './pool.js';

function toTechnician(row) {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    serviceCategoryId: row.service_category_id,
    serviceCategoryName: row.service_category_name,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

const SELECT_TECHNICIAN = `
  SELECT t.id, t.user_id, t.is_active, t.created_at, t.service_category_id,
         u.email, u.full_name, u.phone, sc.name AS service_category_name
  FROM technicians t
  JOIN users u ON u.id = t.user_id
  LEFT JOIN service_categories sc ON sc.id = t.service_category_id
`;

export async function listTechnicians() {
  const { rows } = await getPool().query(
    `${SELECT_TECHNICIAN} ORDER BY t.created_at DESC`,
  );
  return rows.map(toTechnician);
}

export async function listActiveTechnicians() {
  const { rows } = await getPool().query(
    `${SELECT_TECHNICIAN} WHERE t.is_active = true ORDER BY u.full_name`,
  );
  return rows.map(toTechnician);
}

export async function getTechnicianById(id) {
  const { rows } = await getPool().query(`${SELECT_TECHNICIAN} WHERE t.id = $1`, [id]);
  return rows[0] ? toTechnician(rows[0]) : null;
}

export async function createTechnicianProfile(params) {
  await getPool().query('INSERT INTO technicians (user_id, service_category_id) VALUES ($1, $2)', [
    params.userId,
    params.serviceCategoryId,
  ]);
  const technician = await getPool().query(
    `${SELECT_TECHNICIAN} WHERE t.user_id = $1`,
    [params.userId],
  );
  return toTechnician(technician.rows[0]);
}
