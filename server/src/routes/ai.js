import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { requireAuthentication, requireRole, syncUser } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { classifyServiceRequest } from '../services/aiAssistant.js';

export const aiRouter = Router();

// Every call here has a real cost (a chargeable OpenRouter request), so it
// gets a tighter limit than the general API rate limiter — independent of
// whether OpenRouter itself is even configured.
const aiRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

const classifySchema = z.object({
  description: z.string().trim().min(10).max(4000),
});

aiRouter.post(
  '/ai/classify',
  requireAuthentication,
  syncUser,
  requireRole('CUSTOMER'),
  aiRateLimit,
  validateBody(classifySchema),
  async (req, res) => {
    const result = await classifyServiceRequest(req.body.description);
    res.json(result);
  },
);
