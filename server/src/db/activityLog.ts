import { getPool } from './pool.js';

export interface ActivityLogEntry {
  id: string;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function logActivity(params: {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await getPool().query(
    `INSERT INTO activity_logs (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      params.actorUserId,
      params.action,
      params.entityType,
      params.entityId ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null,
    ],
  );
}

export async function listRecentActivity(limit = 50): Promise<ActivityLogEntry[]> {
  const { rows } = await getPool().query<{
    id: string;
    actor_name: string | null;
    actor_role: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>(
    `SELECT al.id, al.action, al.entity_type, al.entity_id, al.metadata, al.created_at,
            u.full_name AS actor_name, u.role AS actor_role
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.actor_user_id
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    actorName: r.actor_name,
    actorRole: r.actor_role,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    metadata: r.metadata,
    createdAt: r.created_at,
  }));
}
