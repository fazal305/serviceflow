import { clerkClient } from '@clerk/express';
import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';

import { logActivity } from '../db/activityLog.js';
import { createTechnicianProfile, listTechnicians } from '../db/technicians.js';
import { createUser, findUserByClerkId } from '../db/users.js';
import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { ApiError } from '../middleware/errorHandler.js';

export const techniciansRouter = Router();

techniciansRouter.get(
  '/technicians',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  async (_req, res) => {
    res.json(await listTechnicians());
  },
);

const createTechnicianSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  serviceCategoryId: z.string().uuid().nullable(),
});

function generateTempPassword() {
  // 16 random bytes -> base64url, plus a fixed symbol/digit so it always
  // satisfies Clerk's default complexity requirements regardless of luck.
  return `${randomBytes(16).toString('base64url')}#1`;
}

techniciansRouter.post(
  '/technicians',
  requireAuthentication,
  syncUser,
  requireRole('ADMIN'),
  validateBody(createTechnicianSchema),
  async (req, res) => {
    const { email, firstName, lastName, serviceCategoryId } = req.body;

    const tempPassword = generateTempPassword();

    let clerkUser;
    try {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        username: `tech_${randomBytes(6).toString('hex')}`,
        password: tempPassword,
        firstName,
        lastName,
        publicMetadata: { role: 'TECHNICIAN' },
      });
    } catch (err) {
      console.error('Failed to create technician Clerk account:', err);
      throw new ApiError(422, 'Could not create account for this email — it may already be in use');
    }

    let dbUser = await findUserByClerkId(clerkUser.id);
    if (!dbUser) {
      dbUser = await createUser({
        clerkUserId: clerkUser.id,
        role: 'TECHNICIAN',
        email,
        fullName: `${firstName} ${lastName}`,
      });
    }

    const technician = await createTechnicianProfile({
      userId: dbUser.id,
      serviceCategoryId,
    });

    await logActivity({
      actorUserId: req.appUser.id,
      action: 'TECHNICIAN_CREATED',
      entityType: 'technician',
      entityId: technician.id,
      metadata: { email },
    });

    // Temp password returned once so the admin can hand it to the
    // technician out-of-band — there's no transactional email provider
    // wired up yet (Section 11 constraint: don't add third-party services
    // without real need). The technician should change it on first login.
    res.status(201).json({ technician, tempPassword });
  },
);
