export const shorthands = undefined;

export async function up(pgm) {
  pgm.createSequence('invoice_number_seq', { start: 1000 });
}

export async function down(pgm) {
  pgm.dropSequence('invoice_number_seq');
}
