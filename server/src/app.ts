import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { customersRouter } from './routes/customers.js';
import { dashboardRouter } from './routes/dashboard.js';
import { healthRouter } from './routes/health.js';
import { invoicesRouter } from './routes/invoices.js';
import { jobsRouter } from './routes/jobs.js';
import { meRouter } from './routes/me.js';
import { quotationsRouter } from './routes/quotations.js';
import { serviceCategoriesRouter } from './routes/serviceCategories.js';
import { serviceRequestsRouter } from './routes/serviceRequests.js';
import { techniciansRouter } from './routes/technicians.js';

export function createApp() {
  const app = express();

  // Every response here varies by the caller's bearer token, but nothing
  // in the request marks that (no cookies, no Vary header) — so HTTP
  // caching (browser cache, intermediate proxies) can't tell one user's
  // response apart from another's and will happily serve/revalidate the
  // wrong user's cached data. Disabling ETags and forcing no-store closes
  // that off entirely rather than trying to get Vary right for every route.
  app.set('etag', false);
  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  // Netlify Functions run behind a proxy that already strips the
  // `/api` prefix mapped in netlify.toml, but the local dev server (which
  // Vite proxies straight through) still sees it — mounting under /api here
  // keeps both environments addressing the same route paths.
  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }),
    healthRouter,
    meRouter,
    serviceCategoriesRouter,
    customersRouter,
    techniciansRouter,
    serviceRequestsRouter,
    quotationsRouter,
    invoicesRouter,
    jobsRouter,
    dashboardRouter,
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
