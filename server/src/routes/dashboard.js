import { Router } from 'express';

import { getDashboardSummary } from '../db/dashboard.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/dashboard/summary',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  async (_req, res) => {
    res.json(await getDashboardSummary());
  },
);
