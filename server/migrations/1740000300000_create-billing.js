export const shorthands = undefined;

export async function up(pgm) {
  pgm.createType('quotation_status', ['PENDING', 'APPROVED', 'REJECTED']);
  pgm.createType('invoice_status', ['UNPAID', 'PARTIALLY_PAID', 'PAID']);
  pgm.createType('line_item_type', ['LABOR', 'PART']);
  pgm.createType('payment_method', ['CASH', 'BANK_TRANSFER', 'ONLINE']);

  pgm.createTable('quotations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    service_request_id: { type: 'uuid', notNull: true, references: 'service_requests', onDelete: 'CASCADE' },
    created_by: { type: 'uuid', notNull: true, references: 'users', onDelete: 'RESTRICT' },
    status: { type: 'quotation_status', notNull: true, default: 'PENDING' },
    subtotal: { type: 'numeric(10,2)', notNull: true },
    tax_rate: { type: 'numeric(5,2)', notNull: true, default: 0 },
    discount_amount: { type: 'numeric(10,2)', notNull: true, default: 0 },
    total: { type: 'numeric(10,2)', notNull: true },
    notes: { type: 'text' },
    valid_until: { type: 'date' },
    decided_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('quotations', 'service_request_id');

  pgm.createTable('quotation_items', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    quotation_id: { type: 'uuid', notNull: true, references: 'quotations', onDelete: 'CASCADE' },
    type: { type: 'line_item_type', notNull: true, default: 'PART' },
    description: { type: 'text', notNull: true },
    quantity: { type: 'integer', notNull: true, default: 1 },
    unit_price: { type: 'numeric(10,2)', notNull: true },
  });
  pgm.createIndex('quotation_items', 'quotation_id');

  pgm.createTable('invoices', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    invoice_number: { type: 'text', notNull: true, unique: true },
    quotation_id: { type: 'uuid', notNull: true, references: 'quotations', onDelete: 'RESTRICT' },
    service_request_id: { type: 'uuid', notNull: true, references: 'service_requests', onDelete: 'CASCADE' },
    customer_id: { type: 'uuid', notNull: true, references: 'customers', onDelete: 'RESTRICT' },
    status: { type: 'invoice_status', notNull: true, default: 'UNPAID' },
    subtotal: { type: 'numeric(10,2)', notNull: true },
    tax_rate: { type: 'numeric(5,2)', notNull: true, default: 0 },
    discount_amount: { type: 'numeric(10,2)', notNull: true, default: 0 },
    total: { type: 'numeric(10,2)', notNull: true },
    due_date: { type: 'date' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('invoices', 'customer_id');
  pgm.createIndex('invoices', 'status');

  pgm.createTable('invoice_items', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    invoice_id: { type: 'uuid', notNull: true, references: 'invoices', onDelete: 'CASCADE' },
    type: { type: 'line_item_type', notNull: true, default: 'PART' },
    description: { type: 'text', notNull: true },
    quantity: { type: 'integer', notNull: true, default: 1 },
    unit_price: { type: 'numeric(10,2)', notNull: true },
  });
  pgm.createIndex('invoice_items', 'invoice_id');

  pgm.createTable('payments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    invoice_id: { type: 'uuid', notNull: true, references: 'invoices', onDelete: 'CASCADE' },
    amount: { type: 'numeric(10,2)', notNull: true },
    method: { type: 'payment_method', notNull: true },
    recorded_by: { type: 'uuid', notNull: true, references: 'users', onDelete: 'RESTRICT' },
    notes: { type: 'text' },
    paid_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('payments', 'invoice_id');
}

export async function down(pgm) {
  pgm.dropTable('payments');
  pgm.dropTable('invoice_items');
  pgm.dropTable('invoices');
  pgm.dropTable('quotation_items');
  pgm.dropTable('quotations');
  pgm.dropType('payment_method');
  pgm.dropType('line_item_type');
  pgm.dropType('invoice_status');
  pgm.dropType('quotation_status');
}
