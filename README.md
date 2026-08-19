# MDFC ProjTrack

React + Vite implementation for the proposed MDFC Project Management System.

## Current MVP

- Role-based workspace for Director, Manager, Employee/Implementor, and Finance Officer
- Project creation with workplan-style fields
- Requisition database matching the current spreadsheet workflow
- Approval stages: Prepared By, Verified By, Executive Approval, Board Approval, and Progress
- Finance views for review, payments, budgets, and reports
- Employee views for tasks, personal requests, and weekly work logs
- Local backend API with JSON persistence for projects, tasks, requests, admin operations, and users

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

To build and serve the production bundle locally:

```bash
npm run build
npm start
```

## Implementation Direction

The current version now has a frontend MVP plus a local development backend. The next steps are real authentication, role permission checks, a production database, file uploads, email notifications, and deployment.
