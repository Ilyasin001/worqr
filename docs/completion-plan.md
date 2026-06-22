# WORQR — Completion Plan

_Living document. Updated each session. Companion to [`project-audit.md`](project-audit.md)._

Last updated: 2026-06-22 · Status: **awaiting Gate 1 approval**

---

## Features already complete (verified)

- JWT login with bcrypt; `protect` / `adminOnly` / `restrictTo` middleware (token field alignment confirmed).
- User / event / shift / assignment / payroll CRUD — functional **within a single global tenant**.
- Payroll `draft → approve → finalize` with a correct Mongoose transaction on finalize.
- Staff payroll history scoped to the requesting user.
- `express-validator` rule chains on all write endpoints.
- React frontend: login + 6 pages wired to the live API; route gating behind auth.
- Jest suite (222 tests) + GitHub Actions CI.

---

## Missing functionality

**Critical (multi-tenancy):** Company entity, company code generation/rotation, user↔company membership, join/onboarding workflow, JWT `companyId`, company-scoped authorization on every endpoint, query-level data isolation across users/events/shifts/assignments/payroll/reporting.

**Auth & account:** email verification, forgot/reset/change password, refresh tokens, logout, token revocation, self-service profile (`/me`).

**Workforce:** event filtering/search/capacity/notes/attachments, shift filtering/conflict detection/recurring shifts, assignment claim/request/status/swaps/reassignment.

**Time tracking:** clock in/out, attendance validation, late/no-show handling.

**Payroll completion:** draft editing/rejection, corrections, payslip generation, exports, company-scoped reporting.

**Platform:** notifications (email + in-app), admin dashboard & metrics, global search, audit logs, file uploads, API docs, health checks, API versioning.

---

## Bugs & defects (with threat level)

| ID | Threat | Defect | Fix outline |
|---|---|---|---|
| SEC-01 | Critical | No tenant isolation (global queries everywhere) | Multi-tenant foundation (Phase 1 / Gate 2) |
| SEC-02 | High | `GET /events` + `GET /events/:id` are public | Add `protect` (+ company scope) |
| SEC-03 | High | `GET /users/:id` exposes any user | Restrict to self or admin-in-company |
| SEC-04 | High | `pre('save')` hooks call undefined `next` (shift, assignment) | Use sync `validate` hook or accept `next` param correctly |
| SEC-05 | Medium | Payroll accepts arbitrary `staffId`, unscoped batch/summary | Bind to company + validate membership |
| SEC-06 | Medium | Inconsistent error handling leaks raw messages | Route all controllers through `AppError` + `errorHandler` |
| SEC-07 | Medium | No `helmet`, no login rate limiting | Add `helmet` + `express-rate-limit` |
| SEC-08 | Low | Hardcoded CORS, no logout/revocation | Env-driven CORS; revocation lands with refresh tokens |
| SEC-09 | Low | `getPayrollSummary` year unvalidated | Validate `year` is an integer |

---

## Technical debt

- Mixed error-handling patterns across controllers.
- `errorMiddleware.js` essentially untested.
- Frontend imports helpers from `data/mockData.js` (verify no mock *data* leaks into live pages).
- Hardcoded placeholder stat deltas on the Dashboard.
- No environment-driven config for CORS / ports / secrets beyond `.env` basics.
- No request logging or structured logging.

---

## Prioritized roadmap

Ordered per the spec's priority list (security → multi-tenancy → auth → authorization → payroll → workforce → reporting → notifications → UX → debt). Approval gates marked.

### ✅ Gate 1 — Audit complete _(approved 2026-06-22)_

### Phase A — Independent bug fixes (no schema change) ✅ DONE 2026-06-22
Owner direction: fix genuinely-broken methods now; bundle authz/endpoint rework
(SEC-02/03/05/06/09) into multi-tenancy since those endpoints get rewritten there.
- [x] SEC-04 fix broken `pre('save')` hooks on shift + assignment (throw intended error, tagged 400); regression test added
- [x] SEC-07 add `helmet` + auth rate limiting (server.js)
- [x] SEC-02 restrict event GET routes — done in Gate 2 (company-scoped + protected)
- [x] SEC-03 restrict `GET /users/:id` to self/admin — done in Gate 2
- [x] SEC-05 payroll scoping — done in Gate 2
- [x] SEC-06 standardize error handling — `errorHandler` rewritten (statusCode-first, Mongoose error mapping); all controllers route through it
- [x] SEC-09 validate payroll summary `year` — done in Gate 2

> Note: the assignment `actualEndTime` hook only runs on `.save()`; current update flow
> uses `findOneAndUpdate`, which bypasses it. Time-tracking validation is a Phase 4 item.

### ✅ Gate 2 — Multi-tenant foundation (DONE 2026-06-22)
- [x] `Company` model (name, owner, unique code, settings) + code generator util
- [x] Company creation (`POST /companies/register`, transactional) + code rotation
- [x] `company` on user/event/shift/assignment/payrollBatch (required, indexed)
- [x] Registration via company code (`POST /auth/register`); membership linking
- [x] JWT includes `companyId`; `protect` sets `req.companyId` from the DB record
- [x] Company-scoped queries on every resource + cross-entity in-company checks
- [x] Cross-tenant isolation test suite (+ company & payroll integration suites)
- [x] Frontend: company onboarding (create / join-with-code) + admin join-code panel
- **Result: 236 tests passing, ~95% line coverage. SEC-01 (Critical) resolved.**

> **Next reassessment point (per owner): scope was "multi-tenancy only for now."**
> Phases 2–9 below remain open and are not started.

### ✅ Phase 2 — Auth & account lifecycle (DONE 2026-06-22, refresh tokens deferred)
- [x] `/me` profile (view + update own name/address); change password (requires current)
- [x] Forgot/reset password — hashed, time-limited tokens; generic 200 to avoid email enumeration
- [x] Soft email verification — token issued on register (staff + company owner), `verify-email` + `resend-verification`; login is **not** blocked (`isVerified` flag + frontend banner)
- [x] Pluggable mailer (`utils/mailer.js`) — logs in dev, silent in test; `services/accountEmails.js` composes verification/reset emails
- [x] Frontend: profile/settings page, forgot/reset/verify screens (emailed-link deep routing), verification banner
- [x] Tests: `account.integration.test.js` (250 tests total, ~96% coverage)
- [x] **Session management (DONE 2026-06-22):** short-lived access tokens (`ACCESS_TOKEN_TTL`, default 15m) + rotating refresh tokens stored hashed in a `RefreshToken` collection (TTL-indexed); `POST /auth/refresh` (rotates), `POST /auth/logout` (revokes); frontend auto-refreshes on 401 and revokes on logout. Tests in `session.integration.test.js` (257 tests total).
- [x] **Real email provider (DONE 2026-06-22):** `utils/mailer.js` sends over SMTP via Nodemailer (any provider, configured by `SMTP_*` / `MAIL_FROM` env vars), best-effort with a console fallback when unconfigured. Verified end to end against a live SMTP server (Ethereal).

**Phase 2 is fully complete.**

> Demo data: `server/scripts/seed.js` seeds a "Demo Events Co" company (code `DEMO2024`, logins `admin@demo.test` / `sam@demo.test`, password `Password1`). `scripts/dev-memory.js` runs the backend on an in-memory DB when no database is reachable.

### Phase 3 — Core workforce operations (admin ops core DONE 2026-06-22)
- [x] Event filtering (status/date-range) + search (title/description/address); **capacity** + live `filledCount`; **notes**
- [x] Shift filtering (eventId/confirmed/date-range)
- [x] Assignment **status** (assigned→confirmed/declined, admin cancel) + **conflict detection** (no double-booking overlapping shifts)
- [x] Frontend: event search/filter/capacity/notes, shift filters, assignment status controls
- [x] Tests: `workforce.integration.test.js` (272 tests total, ~96% coverage)
- [ ] **Deferred to next round:** staff self-service (claim open shifts, request assignments, swaps/reassignment), recurring shifts, and event attachments (→ Phase 8 file storage)

### Phase 4 — Time tracking
- [ ] Clock in/out, attendance validation, late/no-show handling

### Phase 5 — Payroll completion
- [ ] Draft editing/rejection, corrections, payslips, exports, company reporting

### Phase 6 — Notifications (email + in-app)
### Phase 7 — Admin dashboard & metrics
### Phase 8 — Platform (search, audit logs, uploads, API docs, health checks, versioning)
### Phase 9 — Final hardening + `docs/final-project-report.md`

---

## Assumptions (revisit with owner)

- The frontend is in scope (the new spec references dashboards/UX, the old README called it out-of-scope). Treating it as in scope.
- Multi-tenancy assumes a clean-slate migration unless told otherwise.
- Email-dependent features will be built behind an interface and can be stubbed until a provider is chosen.
