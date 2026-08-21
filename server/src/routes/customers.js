import { Router } from 'express';
import { z } from 'zod';

import { listCustomers } from '../db/customers.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validate.js';

export const customersRouter = Router();

const listQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
});

customersRouter.get(
  '/customers',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const { search } = req.validatedQuery;
    res.json(await listCustomers(search));
  },
);
