# MDFC ProjTrack

React + Vite implementation for the proposed MDFC Project Management System.

## Current MVP

- Role-based workspace for Manager, Employee, and Finance Officer
- Project creation with workplan-style fields
- Requisition database matching the current spreadsheet workflow
- Approval stages: Prepared By, Verified By, Executive Approval, Board Approval, and Progress
- Finance views for review, payments, budgets, and reports
- Employee views for tasks, personal requests, and weekly work logs

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal.

## Implementation Direction

The current version focuses on the frontend MVP. The next step is to add persistence for projects, requisitions, tasks, and user roles.
