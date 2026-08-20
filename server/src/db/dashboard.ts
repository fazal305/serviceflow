import { getPool } from './pool.js';

export interface DashboardSummary {
  openRequests: number;
  pendingAssignment: number;
  todaysJobs: number;
  activeTechnicians: number;
  totalCustomers: number;
  statusBreakdown: Array<{ status: string; count: number }>;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const pool = getPool();

  const [openRequests, pendingAssignment, todaysJobs, activeTechnicians, totalCustomers, statusBreakdown] =
    await Promise.all([
      pool.query<{ count: string }>(
        `SELECT count(*) FROM service_requests WHERE status NOT IN ('COMPLETED', 'CANCELLED')`,
      ),
      pool.query<{ count: string }>(
        `SELECT count(*) FROM service_requests WHERE status IN ('NEW', 'UNDER_REVIEW')`,
      ),
      pool.query<{ count: string }>(`SELECT count(*) FROM jobs WHERE scheduled_date = current_date`),
      pool.query<{ count: string }>('SELECT count(*) FROM technicians WHERE is_active = true'),
      pool.query<{ count: string }>('SELECT count(*) FROM customers'),
      pool.query<{ status: string; count: string }>(
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
