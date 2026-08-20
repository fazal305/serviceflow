import { getPool } from './pool.js';

export interface Notification {
  id: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    entityType: row.entity_type,
    entityId: row.entity_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  await getPool().query(
    `INSERT INTO notifications (user_id, title, message, entity_type, entity_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [params.userId, params.title, params.message, params.entityType ?? null, params.entityId ?? null],
  );
}

export async function notifyAdmins(params: { title: string; message: string; entityType?: string; entityId?: string }): Promise<void> {
  const { rows } = await getPool().query<{ id: string }>("SELECT id FROM users WHERE role = 'ADMIN'");
  await Promise.all(rows.map((r) => createNotification({ userId: r.id, ...params })));
}

export async function listNotificationsForUser(userId: string): Promise<Notification[]> {
  const { rows } = await getPool().query<NotificationRow>(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
    [userId],
  );
  return rows.map(toNotification);
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const { rows } = await getPool().query<{ count: string }>(
    'SELECT count(*) FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId],
  );
  return Number(rows[0].count);
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  await getPool().query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, userId]);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await getPool().query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [
    userId,
  ]);
}
