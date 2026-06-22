<h1 align="center">Worqr</h1>
<p align="center"><strong>A multi-tenant web app for event staffing and payroll management.</strong>
<br>Companies onboard their team, schedule events and shifts, assign staff, and run payroll through a controlled draft → approve → finalize workflow.</p>

<h2>About</h2>

Worqr is a full-stack application: a **Node.js/Express REST API** backed by MongoDB, plus a **React (Vite) frontend** that consumes it.

It is **multi-tenant and company-scoped** — every company gets its own isolated workspace. An owner registers a company and receives a unique join code; staff register against that code; and all data (users, events, shifts, assignments, payroll) is scoped to the company. No cross-company access is possible — this isolation is enforced on every query and verified by a dedicated test suite.

Authentication uses JSON Web Tokens carrying `{ id, role, companyId }`, with role-based access control distinguishing `staff` from `admin`. The payroll engine computes hours and pay from worked assignments within a period, then marks them paid inside a database transaction so multi-document updates stay consistent.

<h2>Tech stack</h2>

| Area | Technologies |
|---|---|
| Backend | Node.js, Express (ESM), Mongoose / MongoDB |
| Auth & security | JSON Web Tokens, bcrypt, Helmet, express-rate-limit, CORS |
| Validation | express-validator |
| Frontend | React 18, Vite, React Router |
| Testing | Jest, Supertest, mongodb-memory-server (replica set) |
| CI | GitHub Actions |

<h2>Features</h2>

- **Company onboarding** — create a company (atomic company + first admin), or join an existing one with a company code; admins can view and rotate the join code.
- **Multi-tenant isolation** — every resource is scoped to the caller's company; cross-entity creates verify referenced documents belong to the same company.
- **Authentication & roles** — JWT auth with hashed passwords; `protect`, `adminOnly`, and `restrictTo(...)` middleware; the company is read from the database record, never trusted from the token.
- **Account lifecycle** — self-service profile, change password, forgot/reset password (hashed, time-limited tokens), and soft email verification with a resend flow. Emails are sent over SMTP (any provider) via Nodemailer, with best-effort delivery and a console fallback when SMTP isn't configured.
- **Session management** — short-lived access tokens paired with rotating refresh tokens (stored hashed, with a TTL); the client refreshes transparently on expiry, and logout revokes the refresh token server-side.
- **Workforce management** — CRUD for users, events, shifts, and assignments (hourly rate + break tracking).
- **Payroll workflow** — generate a draft from worked assignments, approve it, then finalize inside a transaction that marks assignments paid; per-staff history, admin batch listings, and yearly summaries.
- **Validation & error handling** — request validation on every write; a centralized error handler returns consistent `{ success, message }` responses and maps Mongoose validation, cast, and duplicate-key errors to the right status codes.
- **React client** — onboarding (create / join), login, and dashboard, events, shifts, staff, assignments, and payroll pages wired to the live API.

<h2>Architecture</h2>

The backend follows a layered design: **routes → controllers → services → models**, with `express-validator` chains and auth middleware wired in front of each route. The frontend is a plain React + Vite SPA with a small hand-rolled fetch client and per-resource API wrappers; `App.jsx` owns auth state and gates routes behind login.

```
worqr/
├── server/
│   ├── src/
│   │   ├── config/        # db.js — MongoDB connection
│   │   ├── controllers/   # auth, company, user, event, shift, assignment, payroll
│   │   ├── middleware/    # authMiddleware (protect / adminOnly / restrictTo), errorMiddleware
│   │   ├── models/        # company, user, event, shift, assignment, payrollBatch
│   │   ├── routes/        # one router per resource
│   │   ├── services/      # payrollService.js (hours/pay calculation)
│   │   ├── validators/    # express-validator rule sets per resource
│   │   ├── utils/         # appError, companyCode, token
│   │   ├── __tests__/      # unit, route, and integration (in-memory Mongo) suites
│   │   └── server.js       # application entry point
│   ├── jest.config.mjs
│   └── package.json
├── frontend/
│   └── src/
│       ├── api/            # fetch client + per-resource wrappers
│       ├── components/     # Layout
│       ├── pages/          # Login, Register, Dashboard, Events, Shifts, Staff, Assignments, Payroll
│       ├── data/           # display helpers
│       ├── App.jsx
│       └── main.jsx
├── docs/                   # project audit, completion plan, multi-tenancy plan
└── .github/workflows/      # CI pipeline (test.yml)
```

<h2>API</h2>

All routes are mounted under `/api`. Send the JWT returned by the auth endpoints as `Authorization: Bearer <token>` on protected routes.

**Onboarding & auth (public)**
- `POST /api/companies/register` — create a company + its first admin; returns a JWT.
- `POST /api/auth/register` — join an existing company using its `companyCode`; returns a JWT.
- `POST /api/auth/login` — authenticate; returns a short-lived access token + a refresh token.
- `POST /api/auth/refresh` — exchange a refresh token for a new access token (rotates the refresh token).
- `POST /api/auth/logout` — revoke a refresh token.
- `POST /api/auth/forgot-password` — request a password-reset link (always returns 200).
- `POST /api/auth/reset-password` — set a new password using the emailed token.
- `POST /api/auth/verify-email` — confirm an email address using the emailed token.

**Account (authenticated)**
- `GET /api/auth/me` — the current user's profile.
- `PATCH /api/auth/me` — update own name / address.
- `POST /api/auth/change-password` — change password (requires the current one).
- `POST /api/auth/resend-verification` — re-send the verification email.

**Company**
- `GET /api/companies/me` — the caller's company (join code shown to admins only).
- `POST /api/companies/rotate-code` — admin regenerates the join code.

**Resources** (all company-scoped)
- `/api/users` — admin CRUD; staff may read their own profile.
- `/api/events`, `/api/shifts`, `/api/assignments` — read for any member; create/update/delete for admins.
- `/api/payroll` — `my-history` (staff); `draft`, `:id/approve`, `:id/finalize`, `batches`, `summary` (admin).

<h2>Getting started</h2>

**Prerequisites:** Node.js 18+ and a MongoDB instance (local or hosted).

**1. Backend**

```sh
git clone https://github.com/Ilyasin001/worqr.git
cd worqr/server
npm install
```

Create a `.env` file in `server/`:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/worqr   # or a MongoDB Atlas connection string
JWT_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_TTL=15m          # short-lived access token
REFRESH_TOKEN_TTL_DAYS=30     # refresh token lifetime
FRONTEND_URL=http://localhost:5173   # used to build links in emails

# Email (optional) — leave blank to log emails to the console instead of sending.
# SMTP_HOST=smtp.your-provider.com
# SMTP_PORT=587
# SMTP_SECURE=false           # true for 465, false for 587
# SMTP_USER=your-smtp-username
# SMTP_PASS=your-smtp-password
# MAIL_FROM=Worqr <no-reply@yourdomain.com>
```

Run it:

```sh
npm run dev    # development with auto-reload (nodemon)
npm start      # production
npm test       # run the Jest suite
```

The API starts on `http://localhost:3001`.

> **Using MongoDB Atlas?** Add your machine's IP to the cluster's *Network Access* allowlist, or connections are refused.

### Seeding demo data

To create a demo company you can log straight into:

```sh
cd server
node scripts/seed.js      # seeds the company configured in MONGO_URI
```

This creates **Demo Events Co** (join code `DEMO2024`) with logins `admin@demo.test` and `sam@demo.test`, both with password `Password1`. Re-running it resets only the demo company.

No database reachable? `node scripts/dev-memory.js` runs the backend against a throwaway in-memory MongoDB and seeds it automatically (data is not persisted).

**2. Frontend**

```sh
cd worqr/frontend
npm install
npm run dev    # Vite dev server on http://localhost:5173
```

The dev server runs on port 5173, which the backend's CORS configuration allows. Open the app, create a company to get started, then share the join code with staff. (`npm run build` produces a production bundle; `npm run preview` serves it.)

<h2>Testing</h2>

The backend has unit (controllers, service, middleware), route, and integration test suites. Integration tests run against an in-memory MongoDB replica set (`mongodb-memory-server`) so real Mongoose transactions are exercised, and include a cross-tenant isolation suite that verifies one company can never read or modify another's data.

```sh
cd server
npm test
```

CI (`.github/workflows/test.yml`) runs `npm ci && npm test` in `server/` on every push and pull request to `main`.

<h2>Project status</h2>

In active development. The multi-tenant foundation and the full authentication & account lifecycle — onboarding, profile, change/forgot/reset password, soft email verification (over SMTP), and session management (access + rotating refresh tokens, logout) — are complete and verified (full backend test suite passing with high coverage). The React client supports onboarding, login, the password/verification flows, a profile page, transparent token refresh, and the core management pages.

Planned next (not yet started): richer workforce operations (filtering, conflict detection, recurring shifts), time tracking, payroll completion (payslips, exports), notifications, and reporting dashboards. See [`docs/completion-plan.md`](docs/completion-plan.md) for the full roadmap.

<h2>Credits</h2>

- Author: <a href="https://github.com/Ilyasin001" target="_blank">Ilyasin001</a>
- Built with Express, Mongoose, React, Vite, and Jest

<h2>License</h2>

Licensed under the terms of the ISC license (per `server/package.json`).
