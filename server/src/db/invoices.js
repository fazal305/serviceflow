import { getPool } from './pool.js';
import { getQuotationById } from './quotations.js';

const SELECT_INVOICE = `
  SELECT i.*, u.full_name AS customer_name, u.email AS customer_email
  FROM invoices i
  JOIN customers c ON c.id = i.customer_id
  JOIN users u ON u.id = c.user_id
`;

async function loadInvoiceItems(invoiceId) {
  const { rows } = await getPool().query(
    'SELECT id, type, description, quantity, unit_price FROM invoice_items WHERE invoice_id = $1',
    [invoiceId],
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    description: r.description,
    quantity: r.quantity,
    unitPrice: Number(r.unit_price),
  }));
}

async function loadPayments(invoiceId) {
  const { rows } = await getPool().query(
    `SELECT p.id, p.amount, p.method, p.notes, p.paid_at, u.full_name AS recorded_by_name
     FROM payments p
     JOIN users u ON u.id = p.recorded_by
     WHERE p.invoice_id = $1
     ORDER BY p.paid_at`,
    [invoiceId],
  );
  return rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    method: r.method,
    notes: r.notes,
    paidAt: r.paid_at,
    recordedByName: r.recorded_by_name,
  }));
}

async function toInvoice(row) {
  const [items, payments] = await Promise.all([loadInvoiceItems(row.id), loadPayments(row.id)]);
  const amountPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const isOverdue =
    row.status !== 'PAID' && !!row.due_date && new Date(row.due_date) < new Date(new Date().toDateString());

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    quotationId: row.quotation_id,
    serviceRequestId: row.service_request_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    status: row.status,
    isOverdue,
    subtotal: row.subtotal,
    taxRate: row.tax_rate,
    discountAmount: row.discount_amount,
    total: row.total,
    amountPaid: amountPaid.toFixed(2),
    dueDate: row.due_date,
    createdAt: row.created_at,
    items,
    payments,
  };
}

export async function createInvoiceFromQuotation(params) {
  const quotation = await getQuotationById(params.quotationId);
  if (!quotation) throw new Error('Quotation not found');
  if (quotation.status !== 'APPROVED') throw new Error('Quotation is not approved');

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: srRows } = await client.query(
      'SELECT customer_id FROM service_requests WHERE id = $1',
      [quotation.serviceRequestId],
    );
    const customerId = srRows[0].customer_id;

    const { rows: seqRows } = await client.query("SELECT nextval('invoice_number_seq')");
    const invoiceNumber = `INV-${seqRows[0].nextval}`;

    const { rows } = await client.query(
      `INSERT INTO invoices
         (invoice_number, quotation_id, service_request_id, customer_id, subtotal, tax_rate, discount_amount, total, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        invoiceNumber,
        quotation.id,
        quotation.serviceRequestId,
        customerId,
        quotation.subtotal,
        quotation.taxRate,
        quotation.discountAmount,
        quotation.total,
        params.dueDate,
      ],
    );
    const invoiceId = rows[0].id;

    for (const item of quotation.items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, type, description, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoiceId, item.type, item.description, item.quantity, item.unitPrice],
      );
    }

    await client.query('COMMIT');

    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Failed to load invoice after creation');
    return invoice;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getInvoiceById(id) {
  const { rows } = await getPool().query(`${SELECT_INVOICE} WHERE i.id = $1`, [id]);
  return rows[0] ? toInvoice(rows[0]) : null;
}

export async function getInvoiceForRequest(serviceRequestId) {
  const { rows } = await getPool().query(
    `${SELECT_INVOICE} WHERE i.service_request_id = $1 ORDER BY i.created_at DESC LIMIT 1`,
    [serviceRequestId],
  );
  return rows[0] ? toInvoice(rows[0]) : null;
}

export async function listInvoicesForAdmin(status) {
  const { rows } = await getPool().query(
    `${SELECT_INVOICE} WHERE ($1::invoice_status IS NULL OR i.status = $1) ORDER BY i.created_at DESC`,
    [status ?? null],
  );
  return Promise.all(rows.map(toInvoice));
}

export async function listInvoicesForCustomer(customerId) {
  const { rows } = await getPool().query(
    `${SELECT_INVOICE} WHERE i.customer_id = $1 ORDER BY i.created_at DESC`,
    [customerId],
  );
  return Promise.all(rows.map(toInvoice));
}
