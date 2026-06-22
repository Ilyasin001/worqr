# WORQR — Project Audit

_Phase 0 deliverable. Status: **awaiting Gate 1 approval**. No implementation has begun._

Date: 2026-06-22 · Branch: `main`

---

## 1. Architecture overview

| Layer | Technology | Notes |
|---|---|---|
| Backend framework | Node.js + Express (ESM) | Layered: routes → controllers → services → models |
| Database | MongoDB via Mongoose | Models: `user`, `event`, `shift`, `assignment`, `payrollBatch` |
| Auth | JWT (Bearer) + bcrypt | Token payload `{ id, role }`; `protect` / `adminOnly` / `restrictTo` middleware |
| Validation | `express-validator` | Per-resource rule chains + shared `validate` middleware (400 JSON) |
| Error handling | Mixed | `errorMiddleware.js` exists; only newer controllers (`payroll`) use `next(err)`. Most still `res.status(500)` directly |
| Frontend | React 18 + Vite + react-router-dom | Hand-rolled `fetch` client (`api/client.js`), JWT in `localStorage` |
| State | None (local component state) | No Redux/Zustand/React Query |
| Tests | Jest (ESM, `jest.unstable_mockModule`) | Unit + route + integration (`mongodb-memory-server`) |
| CI | GitHub Actions | `npm ci && npm test` in `server/` on push/PR to `main` |
| Deployment config | None | No Dockerfile, no host config, no prod env handling |

### API surface (all under `/api`)
- `auth`: `POST /register`, `POST /login`
- `users`: full CRUD (admin-gated except `GET /:id`)
- `events`: CRUD (**`GET` routes are public — no `protect`**)
- `shifts`: CRUD (admin write, any-auth read)
- `assignments`: CRUD (admin write, any-auth read)
- `payroll`: `my-history` (staff), `draft`/`:id/approve`/`:id/finalize`/`batches`/`summary` (admin)

---

## 2. Test baseline (verified, not assumed)

- Ran `npm test`: **222 tests, all passing on a warm run.**
- First run showed 23 failures in the 2 integration suites — this is the one-time `mongodb-memory-server` mongod binary download timing out on cold start, not a code defect. Re-run was green.
- Coverage is high (~94% lines) but **measures only the pre-multi-tenant surface**. `errorMiddleware.js` is effectively uncovered (16%).

---

## 3. Feature inventory (classified per the verification rules)

Classification: **Verified** / **Broken** / **Partial** / **Placeholder** / **Missing**

| Feature | Status | Evidence |
|---|---|---|
| JWT login | Verified | `authController.login` signs `{id, role}`, `protect` reads `decoded.id` — **fields align** (the README's "JWT identity" worry is already resolved in code) |
| Registration | Partial | Works, but ignores company entirely; creates a bare `staff`. No email verification, no company link |
| User CRUD (admin) | Verified (single-tenant) | Works, but **globally scoped** — see security findings |
| Staff self-service profile | Missing | No `/me`, no self-update; spec requires "own profile only" |
| Event CRUD | Broken (authz) | `GET /events` and `GET /events/:id` are **public**; all queries global |
| Shift CRUD | Partial | Works; `pre('save')` time-order hook is **broken** (see SEC-04) |
| Assignment CRUD | Partial | Works; same broken `pre('save')` hook; no company/staff cross-checks |
| Payroll draft→approve→finalize | Verified (logic) | Transactional finalize is correct; but **not company scoped**, any `staffId` accepted |
| Payroll history (staff) | Verified | `getMyPayrollHistory` scopes to `req.user._id` |
| Payroll summary | Partial | No `year` validation; NaN → invalid date; not company scoped |
| Frontend login | Verified | `Login.jsx` + `App.jsx` decode JWT client-side, gate routes |
| Frontend Dashboard | Partial/Placeholder | Live data wired, but stat "change" deltas (`"2 this month"`) are **hardcoded placeholders** |
| Frontend Events/Shifts/Staff/Assignments/Payroll | Partial | Wired to live API; helpers pulled from `data/mockData.js` (verify it's helpers-only) |
| Registration / onboarding UI | Missing | Only login screen exists; `register()` API wrapper unused |
| Profile / password-change UI | Missing | — |
| **Company / multi-tenancy** | **Missing** | No model, no field, no scoping anywhere — the central gap |
| Time tracking (clock in/out) | Missing | `actualStart/EndTime` fields exist but no endpoint/UI sets them |
| Password lifecycle (forgot/reset/change) | Missing | — |
| Sessions (refresh token, logout, revocation) | Missing | — |
| Notifications | Missing | — |
| Reporting/dashboards (server) | Missing | Only yearly summary aggregate |
| Audit logs / file uploads / API docs / health check | Missing | — |

---

## 4. Security findings

Severity per the project's classification (Critical / High / Medium / Low).

| ID | Sev | Finding |
|---|---|---|
| **SEC-01** | **Critical** | **No tenant isolation.** There is no Company concept. Every collection query is global (`User.find()`, `Event.find()`, `Assignment.find()`, payroll filters). Any authenticated admin can read, modify, and delete **all** data across **all** organizations. This is the headline blocker — the app is not multi-tenant at all. |
| **SEC-02** | **High** | **Public event endpoints.** `eventRoutes.js` mounts `GET /` and `GET /:id` before `protect`. Unauthenticated callers can list/read every event in the system. |
| **SEC-03** | **High** | **Broad user read.** `GET /users/:id` is authenticated but not restricted — any staff can fetch any user (incl. `hourlyRate`, address). Spec requires "own profile only". |
| **SEC-04** | **High** | **Broken `pre('save')` validation hooks.** `shift.js` and `assignment.js` call `next(new Error(...))` inside a hook declared `function()` with no `next` param → `ReferenceError: next is not defined`. Invalid time ranges produce an opaque 500/crash instead of a clean validation error; the guard does not work as intended. |
| **SEC-05** | **Medium** | **Payroll cross-scope.** `createPayrollDraft` accepts any `staffId`; `getPayrollBatches`/`getPayrollSummary` filter by arbitrary query params with no company scope. After multi-tenancy this must be company-bound. |
| **SEC-06** | **Medium** | **Inconsistent error handling.** Mixed `res.status(500).json(err.message)` leaks raw error messages and bypasses the central handler; `errorMiddleware` is nearly untested. |
| **SEC-07** | **Medium** | **No security headers / rate limiting.** No `helmet`, no rate limiting on `/auth/login` (brute-force exposure). |
| **SEC-08** | **Low** | **Single hardcoded CORS origin**, no env-driven config; no token revocation/logout (stateless JWT only). |
| **SEC-09** | **Low** | **`getPayrollSummary` input not validated** (`Number(year)` → NaN → invalid date window). |

Note (not a finding): `authController.register` correctly **ignores** any `role` in the body and forces `staff`, so there is no self-registration privilege-escalation path.

### Resolution status (updated 2026-06-22)

All findings above are **resolved** as of the multi-tenant round:
- SEC-04, SEC-07 — fixed in Phase A.
- SEC-01, SEC-02, SEC-03, SEC-05, SEC-06, SEC-09 — fixed in Gate 2 (company scoping + error-handling refactor + input validation).
- SEC-08 (low) — `helmet` added; env-driven CORS and token revocation/logout deferred to the auth-lifecycle phase (Phase 2), tracked in [`completion-plan.md`](completion-plan.md).

---

## 5. Risks

- **Scope.** The three spec documents request ~9 phases (multi-tenancy, full auth lifecycle, time tracking, payroll completion, notifications, dashboards, audit logs, file uploads, API docs). This is a large multi-session build, not a single change.
- **Migration.** Introducing `companyId` is a schema change touching every model, every query, the JWT, and all 222 tests + frontend. Existing data (if any) has no company to belong to — needs a backfill/migration story. This is a **Gate 2** architectural change requiring approval.
- **Test churn.** Company scoping will require updating most integration tests and adding cross-tenant isolation tests.
- **Frontend coupling.** The frontend assumes a flat user model; company code onboarding, profile, and password flows are entirely new UI.

---

## 6. Recommended completion plan (summary)

Full detail and ordering live in [`completion-plan.md`](completion-plan.md). High level, following the spec's priority order:

1. **Gate 1 (now):** approve this audit + plan + security review.
2. **Quick security wins** (low-risk, no schema change): SEC-02 (protect event GETs), SEC-03 (restrict user read), SEC-04 (fix save hooks), SEC-06 (error handling), SEC-07 (helmet + login rate limit). _Can land before the big architecture work._
3. **Gate 2 — Multi-tenant foundation:** Company model, company code, JWT `companyId`, company-scoped middleware, scope every query, isolation tests.
4. Auth & account lifecycle → core workforce ops → time tracking → payroll completion → notifications → admin dashboards → platform features → final hardening.

---

## 7. Open questions for the owner

1. **Build size & cadence** — proceed through all 9 phases, or target a production-ready core (multi-tenancy + auth + workforce + payroll) first and defer notifications/uploads/etc.?
2. **Quick security fixes** — land the no-schema-change security fixes (step 2 above) immediately under this gate, or bundle them into the multi-tenant work?
3. **Existing data** — is there any real/seed data to preserve, or can the company migration assume a clean slate?
4. **Email/notifications** — is there an email provider to integrate (for verification, password reset, notifications), or should these be stubbed behind an interface for now?
