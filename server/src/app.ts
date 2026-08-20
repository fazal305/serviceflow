import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

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
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
