# ServiceFlow

A service-business management platform for AC repair, electrical, plumbing,
appliance repair, IT support, and general maintenance companies — covering
the full workflow from customer service request through technician
assignment, scheduling, work reporting, quotation, invoicing, and payment
tracking.

> **Status: Phase 1 — authentication complete.** Business logic (service
> requests, jobs, quotations, invoicing) is not built yet. This README will
> grow with each phase.

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

## Authentication & authorization (Phase 1)

**Identity vs. role are two different systems, deliberately:**

- **Clerk** owns identity — sign-up, sign-in, sessions, password resets, MFA.
  The frontend never talks to our database for auth; it talks to Clerk
  directly, and every backend request carries a Clerk session token.
- **Our own `users` table** (Postgres) owns *role* — `ADMIN`, `TECHNICIAN`,
  or `CUSTOMER` — and is the source of truth every other table's foreign
  keys will point to. Clerk's token proves *who* someone is; our database
  decides *what they're allowed to do*.

**How the two get linked — just-in-time sync, not a webhook:**
On a user's first authenticated request, `syncUser` middleware
([server/src/middleware/auth.ts](server/src/middleware/auth.ts)) checks for
a `users` row matching their Clerk ID. If none exists, it creates one
defaulting to `CUSTOMER` — the only role public sign-up can ever produce —
and writes that role back to Clerk's `publicMetadata` for consistency. This
avoids needing a Clerk webhook + public tunnel for local development while
still being fully real: it's a genuine DB write and Clerk API call, not a
stub.

**Bootstrapping ADMIN/TECHNICIAN accounts:** nobody can self-serve into a
higher role than `CUSTOMER`. In production, an admin-only endpoint (added in
Phase 2) creates technician accounts. The very first admin has to be
created directly — see `npm run seed:users` below.

**Auth flow:**

```
Browser                          Backend                      Clerk
  │  sign in via <SignIn/>          │                            │
  ├─────────────────────────────────┼───────────────────────────>│
  │  ← session token                │                            │
  │                                 │                            │
  │  GET /api/me                    │                            │
  │  Authorization: Bearer <token> ─>│                            │
  │                                 │  clerkMiddleware verifies  │
  │                                 │  token signature ─────────>│
  │                                 │  syncUser: find/create      │
  │                                 │  row in `users` table       │
  │  ← { id, role, email, ... } ────┤                            │
```

### Test accounts (development only)

Seeded via `npm run seed:users --workspace server` (requires real
`DATABASE_URL` + `CLERK_SECRET_KEY` in `server/.env`). Emails use Clerk's
documented [test-email pattern](https://clerk.com/docs/testing/test-emails-and-phones)
(`+clerk_test@`), so sign-in's email-verification step accepts the fixed
code `424242` instead of sending real mail — these accounts don't need a
real inbox.

| Role | Email | Password |
|---|---|---|
| Admin | `admin+clerk_test@serviceflow.dev` | `ServiceFlow#Dev1` |
| Technician | `technician+clerk_test@serviceflow.dev` | `ServiceFlow#Dev1` |
| Customer | `customer+clerk_test@serviceflow.dev` | `ServiceFlow#Dev1` |

**These are obviously-fake development credentials, not real business
data** — they only exist on your own dev Clerk instance and dev database.
Never seed these (or any `+clerk_test` accounts) against a production Clerk
instance.

## Database migrations

Uses [`node-pg-migrate`](https://github.com/salsita/node-pg-migrate) — plain
up/down migrations, no ORM.

```bash
npm run migrate:up --workspace server     # apply pending migrations
npm run migrate:down --workspace server   # roll back the last migration
npm run migrate:create --workspace server -- <name>   # scaffold a new migration
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

As of Phase 1, `server/.env` needs a real `DATABASE_URL`, `CLERK_SECRET_KEY`,
and `CLERK_PUBLISHABLE_KEY`; `client/.env` needs a real
`VITE_CLERK_PUBLISHABLE_KEY` (same publishable key as the server — it's safe
for the browser). `OPENROUTER_API_KEY` and the Supabase Realtime variables
aren't needed until Phase 6 and Phase 7 respectively.

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
- [x] **Phase 1** — Authentication (Clerk), `users` table + migrations, role-based authorization
- [ ] **Phase 2** — Customers, service requests, admin dashboard, technicians, assignment
- [ ] **Phase 3** — Scheduling, jobs, technician mobile workflow
- [ ] **Phase 4** — Quotations, invoices, payment tracking
- [ ] **Phase 5** — Customer portal, notifications, activity history, reports
- [ ] **Phase 6** — OpenRouter AI Service Assistant
- [ ] **Phase 7** — Realtime updates (Supabase Realtime)
- [ ] **Phase 8** — Testing, performance, security review, production deployment
