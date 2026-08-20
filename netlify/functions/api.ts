import type { Handler } from '@netlify/functions';
import serverless from 'serverless-http';

import { createApp } from '../../server/src/app.js';

const app = createApp();
const serverlessHandler = serverless(app);

const FUNCTION_BASE_PATH = '/.netlify/functions/api';

// netlify.toml rewrites `/api/*` to `/.netlify/functions/api/api/*` so the
// browser-facing path stays `/api/...`. Strip only this function's own base
// segment here, leaving `/api/...` — the same path Express mounts locally.
export const handler: Handler = async (event, context) => {
  const strippedPath = event.path.startsWith(FUNCTION_BASE_PATH)
    ? event.path.slice(FUNCTION_BASE_PATH.length) || '/'
    : event.path;

  return serverlessHandler({ ...event, path: strippedPath }, context);
};
