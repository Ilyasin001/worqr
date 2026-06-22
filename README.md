<div align="center"><img src="images/logo.png" width="80"></div>
<h1 align="center">Worqr</h1>
<p align="center"><strong>A REST API for event staffing and payroll management.</strong>
<br>Create events, schedule shifts, assign staff, and run payroll through a controlled draft → approve → finalize workflow.</p>
<br/>
<div align="center"><img src="demo.gif"></img></div>

<h2>About</h2>

worqr is a Node.js/Express REST API backed by MongoDB. It is a **multi-tenant, company-scoped** platform: each company gets its own isolated workspace. An owner creates a company (receiving a unique join code), staff register against that code, and all events, shifts, assignments, and payroll are scoped to the company — no cross-company data access is possible. Within a company, administrators create events, schedule shifts, assign staff with hourly rates and break tracking, and process payroll. Authentication is handled with JSON Web Tokens (carrying `userId`, `role`, and `companyId`) and role-based access control distinguishing `staff` from `admin`.

The payroll engine calculates hours and pay from worked assignments within a period, then marks those assignments paid inside a database transaction to keep records consistent.

<h2>Goal and requirements</h2>

The aim of this project is to build a secure, well-structured backend for managing event staff and their pay. The implementation is expected to include:

- JWT authentication with hashed passwords and role-based authorization
- CRUD operations for users, events, shifts, and assignments
- A multi-step payroll workflow (draft, approve, finalize) with transactional safety
- Payroll reporting: per-staff history, admin batch listings, and yearly summaries
- Request validation on incoming data
- A clean, layered architecture (routes → controllers → services → models)

A frontend client is planned but not part of the initial backend scope.

<h2>Key learnings</h2>

- Structuring an Express API into clear, separated layers
- Implementing JWT authentication and role-based middleware
- Modelling related data in MongoDB with Mongoose references
- Using database transactions to keep multi-document updates atomic
- Validating and sanitising request input with `express-validator`
- Setting up continuous integration with GitHub Actions and Jest

<h2>Project structure</h2>

```
worqr/
├── server/
│   ├── src/
│   │   ├── config/        # Database connection (db.js)
│   │   ├── controllers/   # Request handlers for each resource
│   │   ├── middleware/    # Auth (protect) and role gating (restrictTo, adminOnly)
│   │   ├── models/        # Mongoose schemas: user, event, shift, assignment, payrollBatch
│   │   ├── routes/        # Route definitions, one file per resource
│   │   ├── services/      # Business logic (payrollService.js)
│   │   ├── validators/    # express-validator rule sets (auth, event)
│   │   ├── utils/         # Shared helpers (appError.js)
│   │   ├── __tests__/     # Jest test suites
│   │   └── server.js      # Application entry point
│   ├── jest.config.mjs
│   └── package.json
├── frontend/              # Placeholder for the future client app
└── .github/workflows/     # CI pipeline (test.yml)
```

All routes are mounted under `/api` — `/api/companies`, `/api/auth`, `/api/users`, `/api/events`, `/api/shifts`, `/api/assignments`, and `/api/payroll`.

### Onboarding endpoints

- `POST /api/companies/register` — create a new company and its first admin (returns a JWT). Public.
- `POST /api/auth/register` — staff join an existing company using its `companyCode` (returns a JWT). Public.
- `POST /api/auth/login` — authenticate (returns a JWT). Public.
- `GET /api/companies/me` — the caller's company (join code shown to admins only).
- `POST /api/companies/rotate-code` — admin regenerates the company join code.

<h2>Installation</h2>

1. Clone this repository and enter the server directory

   ```sh
   git clone https://github.com/Ilyasin001/worqr.git
   cd worqr/server
   ```

2. Install the dependencies

   ```sh
   npm install
   ```

3. Create a `.env` file in the `server/` directory

   ```env
   PORT=3001
   MONGO_URI=mongodb://localhost:27017/worqr
   JWT_SECRET=replace-with-a-long-random-secret
   JWT_EXPIRATION=1d
   ```

4. Run the server

   ```sh
   npm run dev    # development with auto-reload
   npm start      # production
   npm test       # run the test suite
   ```

The server starts on `http://localhost:3001`. Send the token returned by `/api/auth/login` as a Bearer token (`Authorization: Bearer <token>`) on protected routes.

<h2>Contributing</h2>

Contributions are welcome. Please fork the repository and open a pull request, or open an issue with the `enhancement` tag to discuss a change first. See the <a href="https://github.com/Ilyasin001/worqr/pulls" target="_blank">pull requests</a> page.

<h2>Project status</h2>

In active development. The multi-tenant foundation is complete: company isolation is enforced across every resource and verified by a cross-tenant isolation test suite (236 tests passing, ~95% line coverage). The earlier hardening items (save-hook validation, user-update authorization, centralized error handling) are resolved. The React frontend supports company onboarding (create / join-with-code), login, and the core management pages.

Planned next (not yet started): account lifecycle (password reset, email verification, refresh tokens), richer workforce operations (filtering, conflict detection, recurring shifts), time tracking, payroll completion (payslips, exports), notifications, and reporting dashboards. See [`docs/completion-plan.md`](docs/completion-plan.md) for the full roadmap.

<h2>Credits</h2>

- Author: <a href="https://github.com/Ilyasin001" target="_blank">Ilyasin001</a>
- README structure adapted from <a href="https://github.com/r4dixx" target="_blank">Amaël Sikel</a>'s template
- Built with Express, Mongoose, and Jest

<h2>Copyright</h2>

This project is licensed under the terms of the ISC license. See <a href="LICENSE">license</a> for more information.
