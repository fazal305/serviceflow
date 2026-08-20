export const shorthands = undefined;

export async function up(pgm) {
  pgm.createType('request_status', [
    'NEW',
    'UNDER_REVIEW',
    'ASSIGNED',
    'SCHEDULED',
    'IN_PROGRESS',
    'WAITING_FOR_APPROVAL',
    'QUOTATION_APPROVED',
    'COMPLETED',
    'CANCELLED',
  ]);
  pgm.createType('request_priority', ['LOW', 'MEDIUM', 'HIGH']);

  pgm.createTable('service_categories', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true, unique: true },
    slug: { type: 'text', notNull: true, unique: true },
    description: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.sql(`
    INSERT INTO service_categories (name, slug, description) VALUES
      ('HVAC / AC Repair', 'hvac', 'Air conditioning and heating repair, installation, maintenance'),
      ('Electrical', 'electrical', 'Wiring, fixtures, panels, general electrical work'),
      ('Plumbing', 'plumbing', 'Pipes, fixtures, water heaters, drainage'),
      ('Appliance Repair', 'appliance-repair', 'Refrigerators, washers, dryers, ovens'),
      ('IT Support', 'it-support', 'Computer, network, and device troubleshooting'),
      ('Mechanical', 'mechanical', 'Vehicle and mechanical equipment service'),
      ('General Maintenance', 'general-maintenance', 'Other maintenance and repair work')
  `);

  pgm.createTable('customers', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    address: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('technicians', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    service_category_id: { type: 'uuid', references: 'service_categories', onDelete: 'SET NULL' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('service_requests', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    customer_id: { type: 'uuid', notNull: true, references: 'customers', onDelete: 'CASCADE' },
    service_category_id: { type: 'uuid', references: 'service_categories', onDelete: 'SET NULL' },
    description: { type: 'text', notNull: true },
    status: { type: 'request_status', notNull: true, default: 'NEW' },
    priority: { type: 'request_priority', notNull: true, default: 'MEDIUM' },
    preferred_date: { type: 'date' },
    preferred_time: { type: 'text' },
    address: { type: 'text', notNull: true },
    contact_phone: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('service_requests', 'status');
  pgm.createIndex('service_requests', 'customer_id');

  pgm.createTable('assignments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    service_request_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'service_requests',
      onDelete: 'CASCADE',
    },
    technician_id: { type: 'uuid', notNull: true, references: 'technicians', onDelete: 'RESTRICT' },
    assigned_by: { type: 'uuid', notNull: true, references: 'users', onDelete: 'RESTRICT' },
    assigned_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    notes: { type: 'text' },
  });
  pgm.createIndex('assignments', 'technician_id');
}

export async function down(pgm) {
  pgm.dropTable('assignments');
  pgm.dropTable('service_requests');
  pgm.dropTable('technicians');
  pgm.dropTable('customers');
  pgm.dropTable('service_categories');
  pgm.dropType('request_priority');
  pgm.dropType('request_status');
}
