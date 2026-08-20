/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export async function up(pgm) {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createType('user_role', ['ADMIN', 'TECHNICIAN', 'CUSTOMER']);

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    clerk_user_id: { type: 'text', notNull: true, unique: true },
    role: { type: 'user_role', notNull: true, default: 'CUSTOMER' },
    email: { type: 'text', notNull: true },
    full_name: { type: 'text' },
    phone: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('users', 'role');
}

export async function down(pgm) {
  pgm.dropTable('users');
  pgm.dropType('user_role');
}
