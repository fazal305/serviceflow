import { Router } from 'express';

import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
} from '../db/notifications.js';
import { requireAuthentication, syncUser } from '../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.get('/notifications', requireAuthentication, syncUser, async (req, res) => {
  res.json(await listNotificationsForUser(req.appUser!.id));
});

notificationsRouter.get('/notifications/unread-count', requireAuthentication, syncUser, async (req, res) => {
  res.json({ count: await unreadNotificationCount(req.appUser!.id) });
});

notificationsRouter.post(
  '/notifications/:id/read',
  requireAuthentication,
  syncUser,
  async (req, res) => {
    await markNotificationRead(req.params.id as string, req.appUser!.id);
    res.status(204).end();
  },
);

notificationsRouter.post('/notifications/read-all', requireAuthentication, syncUser, async (req, res) => {
  await markAllNotificationsRead(req.appUser!.id);
  res.status(204).end();
});
