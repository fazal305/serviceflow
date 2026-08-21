import { getPool } from './pool.js';

export async function listServiceCategories() {
  const { rows } = await getPool().query(
    'SELECT id, name, slug, description FROM service_categories ORDER BY name',
  );
  return rows;
}
