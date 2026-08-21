import { Router } from 'express';
import { z } from 'zod';

import { findOrCreateCustomerByUserId, updateCustomerAddress } from '../db/customers.js';
import { updateUserProfile } from '../db/users.js';
import { requireAuthentication, syncUser } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const meRouter = Router();

meRouter.get('/me', requireAuthentication, syncUser, async (req, res) => {
  if (req.appUser.role === 'CUSTOMER') {
    const customer = await findOrCreateCustomerByUserId(req.appUser.id);
    res.json({ ...req.appUser, address: customer.address });
    return;
  }

  res.json(req.appUser);
});

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(200).nullable(),
  phone: z.string().trim().max(40).nullable(),
  address: z.string().trim().max(500).nullable(),
});

meRouter.patch(
  '/me',
  requireAuthentication,
  syncUser,
  validateBody(updateProfileSchema),
  async (req, res) => {
    const { fullName, phone, address } = req.body;

    const updated = await updateUserProfile(req.appUser.id, { fullName, phone });

    if (req.appUser.role === 'CUSTOMER') {
      await updateCustomerAddress(req.appUser.id, address);
    }

    res.json({ ...updated, address: req.appUser.role === 'CUSTOMER' ? address : undefined });
  },
);
