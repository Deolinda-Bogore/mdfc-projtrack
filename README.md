# MDFC ProjTrack

React + Vite implementation for the proposed MDFC Project Management System.

## Current MVP

- Role-based workspace for Executive Director, Programs Manager, Finance Director, Administration, and Request Initiator
- Project creation with workplan-style fields
- Requisition database matching the current spreadsheet workflow
- Approval workflow: request initiator from any department → Finance Director review → Executive Director approval → Board approval where required → progress tracking
- Finance Director views for request review, payments, budgets, and reports
- Request Initiator views for tasks, personal requests, supporting documents, and weekly work logs
- Administration views for monthly operations, assets, inventory, travel, HR records, documents, and reports
- Local backend API with JSON persistence for projects, tasks, requests, admin operations, and users
- Demo email/password authentication with hashed local passwords
- Backend role permissions for Executive Director, Programs Manager, Finance Director, Administration, and Request Initiator
- Budget availability checks and budget updates when requests are approved
- Supporting document register with local file-content storage for development
- CSV report exports for the 8 prioritized MDFC reports:
  - Project Dashboard
  - Project Workplan & Activity Status Report
  - MEAL/Indicator Performance Report
  - Budget vs. Expenditure Report
  - Beneficiary/Reach Report
  - Risk & Issues Report
  - Staff Task & Accountability Report
  - Donor/Narrative Reporting Report
- Internal notification records for request initiators, verifiers, approvers, and relevant users

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal.

To run the local backend API in another terminal:

```bash
npm run api
```

The React app uses `/api` through the Vite proxy during development. If the backend is not running, the app stays usable in frontend demo mode.

Demo accounts use the password:

```text
mdfc-demo
```

Available emails:

- `executive.director@medicaldoctorsforchoice.org`
- `programs.manager@medicaldoctorsforchoice.org`
- `request.initiator@medicaldoctorsforchoice.org`
- `finance.director@medicaldoctorsforchoice.org`
- `administration@medicaldoctorsforchoice.org`

To build and serve the production bundle locally:

```bash
npm run build
npm start
```

## Andasy Deployment

The repository includes the deployment files needed by Andasy:

- `Dockerfile`
- `.dockerignore`
- `andasy.hcl`

From the repository folder, deploy with:

```bash
andasy deploy
```

The app listens on port `8080` in production. The local JSON database is written to `/app/data/database.json`, and `andasy.hcl` maps `/app/data` to persistent storage named `mdfc-projtrack-data`.

For the current local-backend version, demo accounts use `mdfc-demo`. Before real production use, replace demo credentials with official staff accounts and connect a hosted database and secure file storage.

## Implementation Direction

The current version now has a frontend MVP plus a local development backend with authentication, role permissions, persistence, budget checks, document storage, reports, notifications, and audit trail support.

For production use, MDFC would still need to choose and configure a hosted database, secure file storage, email notification provider, domain/hosting, backups, and official staff accounts.

## Production Recommendation

For long-term use, Supabase with PostgreSQL is recommended because the PMS has strongly connected data: projects, activities, indicators, targets, budgets, timelines, staff roles, requisitions, approvals, documents, notifications, donor reports, and audit trails. Supabase can also support authentication, role-based access, secure storage, backups, and future email automation.

For document storage, Supabase Storage is recommended if MDFC chooses Supabase/PostgreSQL, because uploaded quotations, invoices, contracts, receipts, reports, concept notes, and payment vouchers can be linked directly to the correct PMS records.
