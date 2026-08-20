import { Router } from 'express';

import { requireAuthentication, syncUser } from '../middleware/auth.js';

export const meRouter = Router();

meRouter.get('/me', requireAuthentication, syncUser, (req, res) => {
  res.json(req.appUser);
});
