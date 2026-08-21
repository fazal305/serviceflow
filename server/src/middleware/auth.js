import { clerkClient } from '@clerk/express';
import { verifyToken } from '@clerk/backend';

import { env } from '../config/env.js';
import { createUser, findUserByClerkId } from '../db/users.js';
import { ApiError } from './errorHandler.js';

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Verifying the exact same valid token was observed to intermittently
// fail. Root cause: this environment's system clock runs a few seconds
// behind the clock on Clerk's token-issuing servers (confirmed by decoding
// a rejected token's `iat` and comparing it to `Date.now()` on both sides
// at the same instant), which trips the default clock-skew tolerance on
// borderline requests. A generous explicit tolerance fixes it at the
// source; the retry loop stays as a second line of defense for any other
// transient failure (network blip fetching Clerk's JWKS, etc).
async function verifyTokenWithRetry(token, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await verifyToken(token, { secretKey: env.clerkSecretKey, clockSkewInMs: 15_000 });
    } catch (err) {
      lastError = err;
      if (attempt < attempts - 1) await sleep(150 * (attempt + 1));
    }
  }
  throw lastError;
}

// Verifies the Authorization: Bearer <token> header directly via
// @clerk/backend's verifyToken, rather than Clerk's `clerkMiddleware()` +
// `getAuth(req)` combo. That combo's automatic request-context detection
// (built for apps that also juggle cookie-based sessions) produced
// intermittent false-negative rejections here on genuinely valid,
// freshly-verified tokens — confirmed by direct verifyToken() calls
// succeeding on the exact tokens clerkMiddleware() had just rejected.
// Explicit verification of the one credential we actually use (the
// bearer token) is both more reliable and easier to reason about for a
// pure API backend with no cookie-based session of its own.
export async function requireAuthentication(req, _res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    throw new ApiError(401, 'Not authenticated');
  }

  try {
    const verified = await verifyTokenWithRetry(token);
    req.auth = { userId: verified.sub };
    next();
  } catch {
    throw new ApiError(401, 'Not authenticated');
  }
}

/**
 * Just-in-time sync between Clerk (identity) and our own `users` table
 * (source of truth for role + relations). New Clerk identities are given
 * exactly one DB row, defaulting to CUSTOMER — nothing about a request
 * can grant a higher role than what's already stored here.
 */
export async function syncUser(req, _res, next) {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new ApiError(401, 'Not authenticated');

    let user = await findUserByClerkId(userId);

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
      const existingRole = clerkUser.publicMetadata.role;
      const role = existingRole ?? 'CUSTOMER';

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

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.appUser || !roles.includes(req.appUser.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
}
