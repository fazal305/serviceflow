import { Router } from 'express';

import { getReportsSummary } from '../db/reports.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';

export const reportsRouter = Router();

reportsRouter.get(
  '/reports/summary',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  async (_req, res) => {
    res.json(await getReportsSummary());
  },
);
