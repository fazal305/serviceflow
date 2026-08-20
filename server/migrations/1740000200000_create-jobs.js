export const shorthands = undefined;

export async function up(pgm) {
  pgm.createTable('jobs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    service_request_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'service_requests',
      onDelete: 'CASCADE',
    },
    scheduled_date: { type: 'date', notNull: true },
    scheduled_time: { type: 'text' },
    started_at: { type: 'timestamptz' },
    completed_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('jobs', 'scheduled_date');

  pgm.createTable('job_notes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    job_id: { type: 'uuid', notNull: true, references: 'jobs', onDelete: 'CASCADE' },
    author_user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'RESTRICT' },
    note: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('job_notes', 'job_id');

  pgm.createTable('job_parts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    job_id: { type: 'uuid', notNull: true, references: 'jobs', onDelete: 'CASCADE' },
    name: { type: 'text', notNull: true },
    quantity: { type: 'integer', notNull: true, default: 1 },
    unit_cost: { type: 'numeric(10,2)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('job_parts', 'job_id');
}

export async function down(pgm) {
  pgm.dropTable('job_parts');
  pgm.dropTable('job_notes');
  pgm.dropTable('jobs');
}
