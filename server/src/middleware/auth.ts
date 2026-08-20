import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express';
import type { NextFunction, Request, Response } from 'express';

import { createUser, findUserByClerkId, type AppUser, type UserRole } from '../db/users.js';
import { ApiError } from './errorHandler.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appUser?: AppUser;
    }
  }
}

// Verifies the Clerk session token on every request (no-op if absent) so
// `getAuth(req)` is available downstream. Cheap enough to mount globally.
export const clerkAuth = clerkMiddleware();

// Rejects unauthenticated requests with a clean 401 JSON response.
// (Not Clerk's `requireAuth()` — that legacy helper 302-redirects toward
// Clerk's hosted sign-in on failure, which breaks cross-origin `fetch`
// calls from the SPA: the browser follows the redirect, hits a CORS wall
// on Clerk's domain, and the request fails with an opaque network error
// instead of a response our code can read.)
export function requireAuthentication(req: Request, _res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }
  next();
}

/**
 * Just-in-time sync between Clerk (identity) and our own `users` table
 * (source of truth for role + relations). New Clerk identities are given
 * exactly one DB row, defaulting to CUSTOMER — nothing about a request
 * can grant a higher role than what's already stored here.
 */
export async function syncUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const { userId } = getAuth(req);
    if (!userId) throw new ApiError(401, 'Not authenticated');

    let user = await findUserByClerkId(userId);

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
      const existingRole = clerkUser.publicMetadata.role as UserRole | undefined;
      const role: UserRole = existingRole ?? 'CUSTOMER';

      user = await createUser({
        clerkUserId: userId,
        role,
        email,
        fullName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
      });

      if (!existingRole) {
        await clerkClient.users.updateUserMetadata(userId, { publicMetadata: { role } });
      }
    }

    req.appUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.appUser || !roles.includes(req.appUser.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
}
