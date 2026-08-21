import { getPool } from './pool.js';

function computeTotals(items, taxRate, discountAmount) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total = Math.max(0, subtotal - discountAmount + (subtotal * taxRate) / 100);
  return { subtotal, total };
}

async function loadItems(quotationId) {
  const { rows } = await getPool().query(
    'SELECT id, type, description, quantity, unit_price FROM quotation_items WHERE quotation_id = $1',
    [quotationId],
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    description: r.description,
    quantity: r.quantity,
    unitPrice: Number(r.unit_price),
  }));
}

async function toQuotation(row) {
  return {
    id: row.id,
    serviceRequestId: row.service_request_id,
    status: row.status,
    subtotal: row.subtotal,
    taxRate: row.tax_rate,
    discountAmount: row.discount_amount,
    total: row.total,
    notes: row.notes,
    validUntil: row.valid_until,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    items: await loadItems(row.id),
  };
}

export async function createQuotation(params) {
  const { subtotal, total } = computeTotals(params.items, params.taxRate, params.discountAmount);

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO quotations
         (service_request_id, created_by, subtotal, tax_rate, discount_amount, total, notes, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        params.serviceRequestId,
        params.createdBy,
        subtotal,
        params.taxRate,
        params.discountAmount,
        total,
        params.notes,
        params.validUntil,
      ],
    );
    const quotationId = rows[0].id;

    for (const item of params.items) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, type, description, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [quotationId, item.type, item.description, item.quantity, item.unitPrice],
      );
    }

    await client.query('COMMIT');

    const quotation = await getQuotationById(quotationId);
    if (!quotation) throw new Error('Failed to load quotation after creation');
    return quotation;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getQuotationById(id) {
  const { rows } = await getPool().query('SELECT * FROM quotations WHERE id = $1', [id]);
  return rows[0] ? toQuotation(rows[0]) : null;
}

export async function getLatestQuotationForRequest(serviceRequestId) {
  const { rows } = await getPool().query(
    'SELECT * FROM quotations WHERE service_request_id = $1 ORDER BY created_at DESC LIMIT 1',
    [serviceRequestId],
  );
  return rows[0] ? toQuotation(rows[0]) : null;
}

export async function decideQuotation(id, status) {
  await getPool().query(
    'UPDATE quotations SET status = $1, decided_at = now(), updated_at = now() WHERE id = $2',
    [status, id],
  );
}
