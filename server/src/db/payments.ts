import { getPool } from './pool.js';
import { canTransition } from '../domain/serviceRequestStatus.js';

export async function recordPayment(params: {
  invoiceId: string;
  amount: number;
  method: 'CASH' | 'BANK_TRANSFER' | 'ONLINE';
  notes: string | null;
  recordedBy: string;
}): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO payments (invoice_id, amount, method, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.invoiceId, params.amount, params.method, params.notes, params.recordedBy],
    );

    const { rows: invoiceRows } = await client.query<{ total: string; service_request_id: string }>(
      'SELECT total, service_request_id FROM invoices WHERE id = $1',
      [params.invoiceId],
    );
    const { total, service_request_id: serviceRequestId } = invoiceRows[0];

    const { rows: paidRows } = await client.query<{ sum: string | null }>(
      'SELECT sum(amount) FROM payments WHERE invoice_id = $1',
      [params.invoiceId],
    );
    const amountPaid = Number(paidRows[0].sum ?? 0);

    const newStatus = amountPaid >= Number(total) ? 'PAID' : amountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
    await client.query('UPDATE invoices SET status = $1, updated_at = now() WHERE id = $2', [
      newStatus,
      params.invoiceId,
    ]);

    if (newStatus === 'PAID') {
      const { rows: srRows } = await client.query<{ status: string }>(
        'SELECT status FROM service_requests WHERE id = $1',
        [serviceRequestId],
      );
      const currentStatus = srRows[0]?.status as Parameters<typeof canTransition>[0] | undefined;
      if (currentStatus && canTransition(currentStatus, 'COMPLETED')) {
        await client.query('UPDATE service_requests SET status = $1, updated_at = now() WHERE id = $2', [
          'COMPLETED',
          serviceRequestId,
        ]);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
