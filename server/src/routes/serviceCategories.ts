import { Router } from 'express';

import { listServiceCategories } from '../db/serviceCategories.js';
import { requireAuthentication, syncUser } from '../middleware/auth.js';

export const serviceCategoriesRouter = Router();

serviceCategoriesRouter.get('/service-categories', requireAuthentication, syncUser, async (_req, res) => {
  res.json(await listServiceCategories());
});
