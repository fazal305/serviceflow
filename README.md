# ServiceFlow

A service-business management platform for AC repair, electrical, plumbing,
appliance repair, IT support, and general maintenance companies — covering
the full workflow from customer service request through technician
assignment, scheduling, work reporting, quotation, invoicing, and payment
tracking.

> **Status: Phase 6 — the AI Service Assistant is built.** The full business
> loop (request → assign → schedule → job → quotation → invoice → payment →
> completed) works end-to-end with notifications, an audit trail, and an
> optional AI triage step on request submission. Realtime updates,
> production security review, and deployment are not done yet. This README
> will grow with each phase.

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
| AI | OpenRouter, called server-side only, with manual-classification fallback — see [AI Service Assistant](#ai-service-assistant-phase-6) |
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

## AI Service Assistant (Phase 6)

```
Customer types a free-text description (English or Urdu/Roman Urdu)
                     │
        clicks "Get AI suggestions" (optional)
                     │
Frontend ──▶ POST /api/ai/classify ──▶ OpenRouter (server-side only —
                     │                  the key never reaches the browser)
                     ▼
     { problems[], possibleCauses[], suggestedServiceCategory,
       suggestedTechnicianType, priority, summary }
                     │
     category + priority pre-filled on the form; customer reviews
     and can change anything before submitting
```

This is an educational/portfolio project, so **no OpenRouter API key is
provided, purchased, or committed anywhere in this repo** — `OPENROUTER_API_KEY`
in `.env.example` is a placeholder like every other credential. To use the AI
Service Assistant, bring your own key from [openrouter.ai/keys](https://openrouter.ai/keys)
and put it in your local `server/.env`. `OPENROUTER_MODEL` is configurable
(default `openai/gpt-4o-mini`) if you'd rather point it at a different model.

**The core workflow never depends on the AI assistant working** — this
isn't just a design goal, it's mechanically enforced:

- `POST /service-requests` (the actual request-creation endpoint) has no
  dependency on `/ai/classify` at all — the AI call is a separate,
  optional step the frontend makes *before* filling in the form, never a
  precondition for submission.
- Every failure mode inside `classifyServiceRequest`
  (`server/src/services/aiAssistant.ts`) — no key configured, network
  error, a 12s timeout, a non-200 from OpenRouter, non-JSON output, or
  JSON that doesn't match the expected shape (validated with Zod) —
  normalizes to the same `{ success: false }` response with an HTTP `200`,
  not a thrown error. The frontend shows one plain message ("Automatic
  analysis isn't available right now") and the form stays fully usable.
- **Verified in the browser** with the placeholder key still in place: the
  button correctly showed the fallback message and the form submitted
  normally — proving the degradation path works, which is the guarantee
  that actually matters here, more than a successful classification would.
- The suggested category is matched against real `service_categories` by
  name server-side before being used — the model can't hand the frontend
  a category that doesn't exist.
- A dedicated rate limit (20 requests / 15 min, separate from the general
  API limiter) caps exposure to this endpoint's real per-call cost.

## Service request workflow (Phase 2)

```
Customer submits request (status: NEW)
   │
Admin reviews, assigns a technician ──▶ status: ASSIGNED
   │                                     (creates a row in `assignments`)
   ▼
Scheduling / job execution — Phase 3
```

Status transitions are centralized in
[server/src/domain/serviceRequestStatus.ts](server/src/domain/serviceRequestStatus.ts)
(Section 19's requirement: no scattered status checks). Only the phase's
actual transitions are enabled today (`NEW`/`UNDER_REVIEW` → `ASSIGNED` or
`CANCELLED`); later statuses already exist in the DB enum but aren't
reachable until the phase that uses them lands.

**Technician onboarding**: admins create technician accounts from
`/admin/technicians` — this creates a real Clerk account (temp password
shown once, since no email provider is wired up) plus the `technicians`
profile row that makes them assignable.

### Notable bugs found and fixed during this phase

Kept here because they're genuinely instructive, not because they're
still open:

- **Bearer-token API responses must disable HTTP caching.** Express sends
  `ETag` by default; without `Cache-Control: no-store`, the browser's HTTP
  cache doesn't know a response varies by `Authorization` header and can
  serve/revalidate one user's cached response for a different user's
  request. Fixed globally in `app.ts` (`app.set('etag', false)` + a
  `no-store` header on every response) rather than per-route.
- **Clock skew between this environment and Clerk's token-issuing
  servers** intermittently failed JWT verification on genuinely valid
  tokens (confirmed by decoding a rejected token's `iat` against
  `Date.now()` on both sides at the same instant). Fixed with an explicit
  `clockSkewInMs` tolerance on `verifyToken`, plus a short retry as a
  second line of defense — see `server/src/middleware/auth.ts`.
- **`clerkMiddleware()` + `getAuth(req)`** (Clerk's Express convenience
  combo) produced intermittent false-negative auth rejections on valid
  tokens, reproducible by re-verifying the exact rejected token directly
  and having it succeed. Replaced with explicit `verifyToken()` on the
  `Authorization` header — more predictable for a pure API backend with no
  cookie-based session of its own.
- **TanStack Query v5's `isLoading` is `false` until a query actually
  starts fetching** — checking it as "no data yet" left a one-render gap
  where role-gated routes (`RoleGate`) saw `data: undefined` and treated
  that as a role mismatch, redirecting a legitimate admin away from the
  page they'd just navigated to. Fixed by using `isPending` (true for the
  entire "no data yet" span) everywhere a query gates a route or
  loading/error UI.
- Upgraded **Express 4 → 5**: Express 4 doesn't forward a rejected promise
  from an `async` route handler to error middleware, so every `throw`
  inside this phase's `async (req, res) => { ... }` handlers would have
  become an unhandled rejection instead of a clean error response. Express
  5 forwards these automatically.

## Scheduling & the technician mobile workflow (Phase 3)

```
ASSIGNED ──(admin schedules)──▶ SCHEDULED ──(technician starts)──▶ IN_PROGRESS
                                                                        │
                                                          (technician completes)
                                                                        ▼
                                                          WAITING_FOR_APPROVAL
                                                     (quotation/invoice — Phase 4)
```

A `jobs` row is created at scheduling time (not at assignment) and holds
only scheduling/timing data (`scheduled_date`, `scheduled_time`,
`started_at`, `completed_at`) — status stays solely on `service_requests`
to avoid duplicating state across two tables. `job_notes` and `job_parts`
capture the technician's work report as they go, which Phase 4's
quotation will read from directly.

**Technician UI is mobile-first, not a shrunk-down admin panel**: the home
screen (`/technician`) is just today's jobs, then upcoming — no sidebar, no
desktop chrome. Job detail (`/technician/jobs/:id`) surfaces exactly what
Section 10 specifies: customer, problem, address (tap-to-call phone),
scheduled time, status, notes, parts, and the actions relevant to the job's
current status (`Start Job` → `Complete Job`, `Add Note`, `Add Part`).
**Photo upload is intentionally not built yet** — it needs a real
file-storage decision (Section 23 says ask before adding an external
provider), so this phase doesn't ship a fake placeholder for it.

**Admin scheduling** is inline in `/admin/service-requests` (a "Schedule"
action appears once a request is `ASSIGNED`) plus a dedicated
`/admin/schedule` list view — not a full calendar widget, which would be
more UI than the data volume at this stage justifies.

Two more bugs found and fixed during this phase:

- **`pg` parses Postgres `date` columns into JS `Date` objects**, which
  then serialize as full ISO timestamps instead of a plain `YYYY-MM-DD` —
  breaking both date display formatting and round-tripping into
  `<input type="date">`. Fixed once, at the driver level
  (`types.setTypeParser(1082, ...)` in `server/src/db/pool.ts`), rather
  than working around it at every call site that touches a date column.

## Quotations, invoices & payments (Phase 4)

```
WAITING_FOR_APPROVAL ──(admin quotes)──▶ [Quotation: PENDING]
                                               │
                              customer approves │ rejects
                                               ▼
                                    QUOTATION_APPROVED
                                               │
                                admin creates invoice (items snapshotted
                                from the quotation — an invoice is a
                                financial record, must stay immutable
                                even if the quotation could change)
                                               │
                                       [Invoice: UNPAID]
                                               │
                            admin records payments (manual — Cash/Bank
                            Transfer/Online, no real gateway per spec)
                                               │
                          sum(payments) < total → PARTIALLY_PAID
                          sum(payments) >= total → PAID ──▶ COMPLETED
```

- **Rejecting** a quotation leaves the request in `WAITING_FOR_APPROVAL` so
  admin can send a revised one — nothing about rejection is destructive.
- **Invoice status is derived, not admin-set**: `UNPAID` /
  `PARTIALLY_PAID` / `PAID` come from summing actual payment rows, and
  `OVERDUE` is computed at read time from `due_date` rather than stored —
  avoiding a second source of truth that could drift out of sync with the
  payments that actually happened.
- **Paying an invoice off in full auto-completes the service request** —
  the only place in the whole codebase where a status transition happens
  as a side effect of something other than a direct user action, and it's
  exactly what closes the loop the spec's own workflow diagram describes.

Two more real bugs found and fixed here, worth keeping for the pattern
they represent:

- **Native `<input max>` validation vs. floating-point money math.** The
  "record payment" field pre-filled the remaining balance via
  `remaining.toFixed(2)` (e.g. `"9.08"`) but set `max={remaining}` from
  the raw float (`9.079999999999998` — `109.08 - 100` isn't exact in
  IEEE 754). The browser's native range validation silently blocked every
  submission (`value 9.08 > max 9.079999999999998`) with no visible error
  — the button just did nothing. Fixed by rounding `remaining` to money
  precision once, at the source, so every consumer (the `max` attribute,
  the pre-filled value, the display) uses the same number.
- **`defaultValue` on a DOM node that outlives the data it was seeded
  from.** The same input kept showing the *first* payment's leftover
  amount when reopened for a second payment, because the underlying
  `<dialog>` stays mounted between opens (only toggled), and React's
  `defaultValue` only applies once, on creation — it doesn't refresh when
  the prop changes on a later render. Fixed with `key={remaining}`,
  forcing a fresh DOM node (and a fresh `defaultValue`) whenever the
  actual remaining balance changes.

## Notifications, activity history & reports (Phase 5)

**Notifications are triggered by real events, not decorative.** Every
meaningful action in the workflow creates a persisted row for the actual
person who needs to know:

| Event | Who's notified |
|---|---|
| Customer submits a request | All admins |
| Admin assigns a technician | Customer + the assigned technician |
| Admin schedules the job | Customer |
| Technician completes the job | Customer |
| Admin sends a quotation | Customer |
| Customer approves/rejects a quotation | All admins |
| Admin creates an invoice | Customer |
| Admin records a payment | Customer (different message if it's the final payment) |

The bell icon (in every layout — admin, customer, and technician) polls
unread count every 30s and marks everything read when opened. This is
genuinely persisted state in the `notifications` table, not a toast that
disappears on refresh.

**Activity log** (`/admin/activity`) records actor + action + entity +
timestamp for every state-changing action across the whole app — the
audit trail Section 34 asks for. Both `notifications` and `activity_logs`
are populated from the same call sites, but serve different purposes:
notifications are addressed to one person about something relevant to
*them*; the activity log is an admin-only feed of everything that
happened, addressed to no one in particular.

**Reports** (`/admin/reports`) answer real business questions with real
aggregation queries — revenue by month (charted, since a trend genuinely
reads faster as a chart than a table), completed jobs, jobs by category,
completed jobs by technician, pending payments total, and average days to
complete. Recharts (and its d3 dependencies) is lazy-loaded for this one
route only — customers and technicians never download it.

**Customer portal** now covers every page Section 8 lists: My Requests
(active), Service History (completed/cancelled), Request Detail
(quotation approve/reject, invoice view), Invoices, and an editable
Profile (name, phone, default address) via `PATCH /me`.

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
- [x] **Phase 2** — Customers, service requests, admin dashboard, technicians, assignment
- [x] **Phase 3** — Scheduling, jobs, technician mobile workflow, job completion
- [x] **Phase 4** — Quotations, invoices, payment tracking
- [x] **Phase 5** — Customer portal, notifications, activity history, reports
- [x] **Phase 6** — OpenRouter AI Service Assistant
- [ ] **Phase 7** — Realtime updates (Supabase Realtime)
- [ ] **Phase 8** — Testing, performance, security review, production deployment
