import { getPool } from './pool.js';

export async function getReportsSummary() {
  const pool = getPool();

  const [revenueByMonth, completedJobs, jobsByTechnician, jobsByCategory, pendingPayments, avgCompletion] =
    await Promise.all([
      pool.query(
        `SELECT to_char(date_trunc('month', paid_at), 'YYYY-MM') AS month, sum(amount) AS revenue
         FROM payments
         WHERE paid_at >= now() - interval '6 months'
         GROUP BY 1
         ORDER BY 1`,
      ),
      pool.query(`SELECT count(*) FROM service_requests WHERE status = 'COMPLETED'`),
      pool.query(
        `SELECT u.full_name AS technician, count(*) AS count
         FROM assignments a
         JOIN service_requests sr ON sr.id = a.service_request_id
         JOIN technicians t ON t.id = a.technician_id
         JOIN users u ON u.id = t.user_id
         WHERE sr.status = 'COMPLETED'
         GROUP BY u.full_name
         ORDER BY count DESC
         LIMIT 10`,
      ),
      pool.query(
        `SELECT coalesce(sc.name, 'General') AS category, count(*) AS count
         FROM service_requests sr
         LEFT JOIN service_categories sc ON sc.id = sr.service_category_id
         WHERE sr.status NOT IN ('CANCELLED')
         GROUP BY coalesce(sc.name, 'General')
         ORDER BY count DESC`,
      ),
      pool.query(
        `SELECT sum(total - (SELECT coalesce(sum(amount), 0) FROM payments p WHERE p.invoice_id = i.id)) AS total
         FROM invoices i
         WHERE status != 'PAID'`,
      ),
      pool.query(
        `SELECT avg(extract(epoch FROM (updated_at - created_at)) / 86400) AS avg_days
         FROM service_requests
         WHERE status = 'COMPLETED'`,
      ),
    ]);

  return {
    revenueByMonth: revenueByMonth.rows.map((r) => ({ month: r.month, revenue: Number(r.revenue) })),
    completedJobs: Number(completedJobs.rows[0].count),
    jobsByTechnician: jobsByTechnician.rows.map((r) => ({
      technician: r.technician,
      count: Number(r.count),
    })),
    jobsByCategory: jobsByCategory.rows.map((r) => ({ category: r.category, count: Number(r.count) })),
    pendingPaymentsTotal: Number(pendingPayments.rows[0].total ?? 0),
    avgCompletionDays: avgCompletion.rows[0].avg_days ? Number(avgCompletion.rows[0].avg_days) : null,
  };
}
