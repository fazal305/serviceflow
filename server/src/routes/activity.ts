import { Router } from 'express';

import { listRecentActivity } from '../db/activityLog.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';

export const activityRouter = Router();

activityRouter.get(
  '/activity',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  async (_req, res) => {
    res.json(await listRecentActivity());
  },
);
