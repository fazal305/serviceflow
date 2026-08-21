import { getPool } from './pool.js';

function toJob(row) {
  return {
    id: row.id,
    serviceRequestId: row.service_request_id,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    description: row.description,
    priority: row.priority,
    address: row.address,
    contactPhone: row.contact_phone,
    serviceCategoryName: row.service_category_name,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    technicianId: row.technician_id,
    technicianName: row.technician_name,
  };
}

const SELECT_JOB = `
  SELECT j.id, j.service_request_id, j.scheduled_date, j.scheduled_time,
         j.started_at, j.completed_at,
         sr.status, sr.description, sr.priority, sr.address, sr.contact_phone,
         sc.name AS service_category_name,
         cu.full_name AS customer_name, cu.email AS customer_email,
         a.technician_id, tu.full_name AS technician_name
  FROM jobs j
  JOIN service_requests sr ON sr.id = j.service_request_id
  JOIN customers c ON c.id = sr.customer_id
  JOIN users cu ON cu.id = c.user_id
  LEFT JOIN service_categories sc ON sc.id = sr.service_category_id
  JOIN assignments a ON a.service_request_id = sr.id
  JOIN technicians t ON t.id = a.technician_id
  JOIN users tu ON tu.id = t.user_id
`;

export async function getTechnicianIdForUser(userId) {
  const { rows } = await getPool().query(
    'SELECT id FROM technicians WHERE user_id = $1',
    [userId],
  );
  return rows[0]?.id ?? null;
}

export async function scheduleJob(params) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO jobs (service_request_id, scheduled_date, scheduled_time)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [params.serviceRequestId, params.scheduledDate, params.scheduledTime],
    );
    await client.query('UPDATE service_requests SET status = $1, updated_at = now() WHERE id = $2', [
      'SCHEDULED',
      params.serviceRequestId,
    ]);
    await client.query('COMMIT');

    const job = await getJobById(rows[0].id);
    if (!job) throw new Error('Failed to load job after scheduling');
    return job;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getJobById(id) {
  const { rows } = await getPool().query(`${SELECT_JOB} WHERE j.id = $1`, [id]);
  return rows[0] ? toJob(rows[0]) : null;
}

export async function listJobsForTechnician(technicianId) {
  const { rows } = await getPool().query(
    `${SELECT_JOB} WHERE a.technician_id = $1 ORDER BY j.scheduled_date, j.scheduled_time`,
    [technicianId],
  );
  return rows.map(toJob);
}

export async function listJobsForAdmin() {
  const { rows } = await getPool().query(
    `${SELECT_JOB} ORDER BY j.scheduled_date, j.scheduled_time`,
  );
  return rows.map(toJob);
}

async function transitionAndTimestamp(jobId, serviceRequestId, status, timestampColumn) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE jobs SET ${timestampColumn} = now(), updated_at = now() WHERE id = $1`, [
      jobId,
    ]);
    await client.query('UPDATE service_requests SET status = $1, updated_at = now() WHERE id = $2', [
      status,
      serviceRequestId,
    ]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function startJob(jobId, serviceRequestId) {
  await transitionAndTimestamp(jobId, serviceRequestId, 'IN_PROGRESS', 'started_at');
}

export async function completeJob(jobId, serviceRequestId) {
  await transitionAndTimestamp(jobId, serviceRequestId, 'WAITING_FOR_APPROVAL', 'completed_at');
}

export async function listJobNotes(jobId) {
  const { rows } = await getPool().query(
    `SELECT jn.id, jn.note, u.full_name AS author_name, jn.created_at
     FROM job_notes jn
     JOIN users u ON u.id = jn.author_user_id
     WHERE jn.job_id = $1
     ORDER BY jn.created_at`,
    [jobId],
  );
  return rows.map((r) => ({ id: r.id, note: r.note, authorName: r.author_name, createdAt: r.created_at }));
}

export async function addJobNote(jobId, authorUserId, note) {
  const { rows } = await getPool().query(
    `INSERT INTO job_notes (job_id, author_user_id, note) VALUES ($1, $2, $3) RETURNING id, created_at`,
    [jobId, authorUserId, note],
  );
  return { id: rows[0].id, note, authorName: null, createdAt: rows[0].created_at };
}

export async function listJobParts(jobId) {
  const { rows } = await getPool().query(
    'SELECT id, name, quantity, unit_cost, created_at FROM job_parts WHERE job_id = $1 ORDER BY created_at',
    [jobId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    quantity: r.quantity,
    unitCost: r.unit_cost,
    createdAt: r.created_at,
  }));
}

export async function addJobPart(params) {
  const { rows } = await getPool().query(
    `INSERT INTO job_parts (job_id, name, quantity, unit_cost) VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [params.jobId, params.name, params.quantity, params.unitCost],
  );
  return {
    id: rows[0].id,
    name: params.name,
    quantity: params.quantity,
    unitCost: params.unitCost !== null ? String(params.unitCost) : null,
    createdAt: rows[0].created_at,
  };
}
