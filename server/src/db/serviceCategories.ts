import { getPool } from './pool.js';

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export async function listServiceCategories(): Promise<ServiceCategory[]> {
  const { rows } = await getPool().query<ServiceCategory>(
    'SELECT id, name, slug, description FROM service_categories ORDER BY name',
  );
  return rows;
}
