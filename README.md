# ServiceFlow

A service-business management platform for AC repair, electrical, plumbing,
appliance repair, IT support, and general maintenance companies — covering
the full workflow from customer service request through technician
assignment, scheduling, work reporting, quotation, invoicing, and payment
tracking.

> **Status: Phase 0 — architecture & project setup.** Auth, business logic,
> and the AI assistant are not built yet. This README will grow with each
> phase.

## Architecture

```
Browser (React + Vite)
   │
   ├── local dev  →  Vite dev server (proxies /api/* to Express on :4000)
   │
   └── production →  Netlify CDN (static build)
                         │
                         └── /api/*  →  Netlify Function (Express app,
                                         wrapped via serverless-http)
                                            │
                                            ├── Supabase Postgres (data)
                                            ├── Clerk (auth verification)
                                            └── OpenRouter (AI assistant,
                                                Phase 6 only)

Realtime updates: browser subscribes directly to Supabase Realtime
channels (Postgres change events) — no custom WebSocket server needed.
```

**Why this shape:** Netlify only runs serverless Functions, not a
long-lived process — so the same Express app that runs locally with
`node`/`tsx` for development is wrapped with `serverless-http` and deployed
as a single Netlify Function in production, rather than maintaining two
separate backends. Realtime features (Section 17 of the spec — new request
notifications, job status changes, live dashboard updates) can't use a
traditional WebSocket server on Netlify either, so those are handled by
Supabase Realtime instead, which is infrastructure we already have because
Supabase hosts the database.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (hosted on Supabase) |
| Auth | Clerk (roles: `ADMIN`, `TECHNICIAN`, `CUSTOMER` via custom claims) |
| Realtime | Supabase Realtime (Postgres change subscriptions) |
| AI | OpenRouter, called server-side only, with manual-classification fallback |
| Deployment | Netlify (static frontend + Netlify Function backend) |

## Project structure

```
serviceflow/
├── client/                 # React + Vite frontend
│   └── src/
├── server/                 # Express backend (runs locally as a normal process)
│   └── src/
│       ├── app.ts          # Express app factory (no .listen — reusable by both entrypoints)
│       ├── index.ts        # Local dev entrypoint (calls .listen)
│       ├── config/         # Environment loading/validation
│       ├── routes/         # Route definitions
│       ├── controllers/    # Request handling (added from Phase 1 onward)
│       ├── services/       # Business logic (added from Phase 1 onward)
│       ├── middleware/     # Error handling, auth, validation
│       └── db/             # Database client (added from Phase 1 onward)
├── netlify/functions/
│   └── api.ts               # Wraps server's Express app for Netlify Functions
└── netlify.toml              # Build config, function bundling, redirects
```

## Local development

Requires Node.js 20+.

```bash
npm install
```

Run the backend and frontend in two terminals:

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173 (proxies /api/* to :4000)
```

Open http://localhost:5173 — it calls `/api/health` on load and shows
"API connected" if the backend is reachable, or a clear error state if not.

## Environment variables

See [`.env.example`](.env.example) for the full reference — it documents
every variable, which file it belongs in (`client/.env` vs `server/.env`),
and where to get each value. No real credentials are committed; `.env`
files are gitignored.

Phase 0 requires **no environment variables** — the health-check page works
with zero configuration. Database, auth, and AI keys are introduced in
later phases as each is actually wired up.

## Build

```bash
npm run build:client   # outputs client/dist
npm run build:server   # type-checks + compiles server/src to server/dist (local-only; Netlify bundles server/src directly via esbuild)
```

## Deployment (Netlify)

Not yet configured — this happens once the app has enough functionality to
be worth deploying. `netlify.toml` is already in place so deployment is a
matter of connecting the repository in the Netlify dashboard and setting
the environment variables from `.env.example` there, not retrofitting
architecture.

## Roadmap

- [x] **Phase 0** — Architecture, project scaffold, Netlify Function wiring
- [ ] **Phase 1** — Authentication (Clerk), role-based authorization
- [ ] **Phase 2** — Customers, service requests, admin dashboard, technicians, assignment
- [ ] **Phase 3** — Scheduling, jobs, technician mobile workflow
- [ ] **Phase 4** — Quotations, invoices, payment tracking
- [ ] **Phase 5** — Customer portal, notifications, activity history, reports
- [ ] **Phase 6** — OpenRouter AI Service Assistant
- [ ] **Phase 7** — Realtime updates (Supabase Realtime)
- [ ] **Phase 8** — Testing, performance, security review, production deployment
