# Multi-Tenancy Implementation Plan (Gate 2)

_Architecture-change proposal. Status: **awaiting Gate 2 approval** — no schema changes made yet._

Owner decisions in effect: **clean slate** (no data migration), scope = **multi-tenancy only** this round, email features out of scope.

---

## 1. Why this change is needed

The app currently has no tenant concept — every query is global, so any authenticated admin can access all organizations' data (SEC-01, Critical). The spec defines WORQR as a company-scoped platform where tenant isolation is a hard security requirement. This is the single blocker to production readiness.

## 2. Existing schema (relevant fields)

```
User      { name, email, passwordHash, role, hourlyRate, address }
Event     { title, description, date, address, createdBy→User, status }
Shift     { managerId→User, eventId→Event, startTime, endTime, confirmed }
Assignment{ shiftId→Shift, staffId→User, hourlyRate, breakDuration, actual*, isPaid }
PayrollBatch { staff→User, period*, totals, assignments[], status, processedBy }
```
No company linkage anywhere.

## 3. Proposed schema

**New model — `Company`:**
```
Company {
  name:    String, required
  code:    String, required, unique, indexed   // human-friendly join code, e.g. "WQ7K2P9X"
  owner:   ObjectId → User, required
  settings:{ timezone: String (default "UTC") }  // minimal; extend later
  timestamps
}
```

**Add `company: ObjectId → Company, required, indexed` to:** `User`, `Event`, `Shift`, `Assignment`, `PayrollBatch`.

Compound indexes to add: `User { company, email }`, and `company` on each scoped collection for query performance.

## 4. New flows

| Flow | Endpoint | Behavior |
|---|---|---|
| Create company (owner) | `POST /api/companies/register` | Creates Company + first **admin** User atomically (transaction); generates a unique `code`; returns JWT. Public. |
| Join company (staff) | `POST /api/auth/register` | Now **requires `companyCode`**; validated against an existing Company; creates a `staff` user linked to it. |
| View company | `GET /api/companies/me` | Returns the caller's company (incl. code for admins). |
| Rotate code | `POST /api/companies/rotate-code` | Admin/owner only; regenerates `code`. |

## 5. Authorization redesign

- **JWT payload** becomes `{ id, role, companyId }`.
- **`protect`** loads `req.user` from DB (source of truth) and sets `req.companyId = req.user.company`. The token's `companyId` is not trusted for authorization — the DB value is.
- **Every query is company-scoped.** Reads filter by `{ company: req.companyId }`; writes set `company: req.companyId` from the session (never from the request body). `:id` lookups verify the doc's `company` matches before returning (404 if not, to avoid leaking existence).
- **Cross-entity checks:** creating a shift verifies its event is in-company; creating an assignment verifies both the shift and the staff member are in-company.
- Folds in **SEC-02** (event GETs become protected + scoped), **SEC-03** (`GET /users/:id` → self or same-company admin), **SEC-05** (payroll bound to company + membership), **SEC-06** (controllers routed through `AppError`/`errorHandler` as they're rewritten), **SEC-09** (year validation).

A shared helper (`scopeToCompany(req)` / a `findInCompany` util) keeps scoping explicit and testable rather than relying on implicit query magic.

## 6. Migration & rollback

- **Migration:** none required — clean slate. `company` ships as `required: true`; the dev database is dropped and reseeded. (If any data existed, the fallback would be a one-off script assigning records to a default company — not needed here.)
- **Rollback:** `git revert` the change set; no data transformation to undo. The new collections/fields are additive.

## 7. Risks

- **Test churn:** `helper.js` and most integration tests need a company + `companyId` in tokens/seeds. Mitigated by updating the seed helpers centrally first.
- **Chicken-and-egg** on first user: solved by the dedicated `companies/register` transactional endpoint that creates company + owner together.
- **Scope leakage** if any query is missed: mitigated by routing all reads/writes through the shared scoping helper and adding explicit cross-tenant isolation tests.

## 8. Alternatives considered

- **DB-per-tenant** — strong isolation but heavy ops overhead; rejected for this scale.
- **Mongoose plugin auto-injecting the company filter** — DRY but implicit/magical and harder to audit; rejected in favor of explicit scoping (controllers are being rewritten anyway).
- **Trusting `companyId` from the JWT** — rejected; authoritative value is the DB user record.

## 9. Proposed build order (small, verifiable increments)

1. `Company` model + code generator util (+ unit tests).
2. `companies` routes/controller: register, me, rotate-code (+ tests).
3. Add `company` to `User`; rewrite auth register to require `companyCode`; JWT carries `companyId`; `protect` sets `req.companyId`.
4. Add `company` to Event + scope event controller/routes (folds SEC-02).
5. Same for Shift, then Assignment (with cross-entity checks).
6. Same for PayrollBatch + payroll controller (folds SEC-05/09); error handling standardized (SEC-06).
7. Update `helper.js` seeds + all integration tests; add cross-tenant isolation suite.
8. Frontend: company onboarding (create / join-with-code) + register screen.
9. Update README + audit/plan docs.

Each step ends with `npm test` green before moving on.

---

**Requesting approval to proceed with step 1.**
