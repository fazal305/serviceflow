import { getPool } from './pool.js';

export async function getDashboardSummary() {
  const pool = getPool();

  const [openRequests, pendingAssignment, todaysJobs, activeTechnicians, totalCustomers, statusBreakdown] =
    await Promise.all([
      pool.query(
        `SELECT count(*) FROM service_requests WHERE status NOT IN ('COMPLETED', 'CANCELLED')`,
      ),
      pool.query(
        `SELECT count(*) FROM service_requests WHERE status IN ('NEW', 'UNDER_REVIEW')`,
      ),
      pool.query(`SELECT count(*) FROM jobs WHERE scheduled_date = current_date`),
      pool.query('SELECT count(*) FROM technicians WHERE is_active = true'),
      pool.query('SELECT count(*) FROM customers'),
      pool.query(
        `SELECT status, count(*) FROM service_requests GROUP BY status`,
      ),
    ]);

  return {
    openRequests: Number(openRequests.rows[0].count),
    pendingAssignment: Number(pendingAssignment.rows[0].count),
    todaysJobs: Number(todaysJobs.rows[0].count),
    activeTechnicians: Number(activeTechnicians.rows[0].count),
    totalCustomers: Number(totalCustomers.rows[0].count),
    statusBreakdown: statusBreakdown.rows.map((r) => ({ status: r.status, count: Number(r.count) })),
  };
}
