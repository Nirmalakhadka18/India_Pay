# Convex Template Audit for IndiaPay

## Existing Architecture Overview
The current codebase is a modern Turborepo monorepo built using Next.js, React, TypeScript, and Tailwind CSS on the frontend. The backend and database are powered by Convex.
- **Frontend**: Next.js 14 App Router, React 18, Tailwind CSS, Biome (for linting/formatting).
- **Backend/Database**: Convex (Serverless Backend, Database, Storage, and Authentication).
- **Package Manager**: Bun (`bun@1.1.26`).
- **Monorepo Structure**: Contains `apps/app` (main application), `apps/web` (landing page), and packages including `packages/backend` (Convex logic) and `packages/ui` (Reusable UI components).

## Current Routes and Modules
The main application (`apps/app`) is localized and uses Next.js App Router:
- **Public Routes**: `(public)/login` for authentication.
- **Dashboard Routes**: `(dashboard)` contains `files`, `jobs`, `platform`, and `settings` modules.
- **Onboarding Route**: `onboarding` workflow.
- **Catch-all/Error Handling**: `[...rest]`, `error.tsx`, `not-found.tsx`, `global-error.tsx`.

## Convex Schema and Backend Overview
The existing Convex schema (`packages/backend/convex/schema.ts`) includes:
- **Authentication/Users**: `users` and Convex Auth tables.
- **Workspaces (Tenants)**: `workspaces`, `members`, `invites` - forming a robust multi-tenant foundation.
- **System/Utilities**: `events`, `jobs`, `auditLogs`, `usage`, `apiKeys`, `files`, `notifications`, `counters`.
- **Backend Features**: Storage generation (`users.ts`), audits (`audit.ts`), cron jobs/background tasks (`jobs.ts`), and basic subscription billing via Polar (`subscriptions.ts`).

## Authentication and Authorization Findings
- **Authentication**: Managed via `@convex-dev/auth`. Supports Email/Password (with strength validation, verification, and reset via OTP), Magic Email OTP, and Google OAuth.
- **Authorization**: Workspace-scoped logic in `orgs.ts`. Members have roles: `"owner"`, `"admin"`, and `"member"`. `requireRole` and `requireMember` helpers are used across mutations to ensure tenant data isolation.

## Reusable Components
A robust set of reusable components resides in `packages/ui/src/components`:
- `avatar`, `button`, `dialog`, `dropdown-menu`, `icons`, `input`, `logo`, `scroll-area`, `select`, `switch`, `tooltip`, `upload-input`.

## Missing Payroll Functionality
The application currently lacks any domain-specific logic for Indian payroll. Missing modules include:
- Employee Management (Master Data, Documents, Bank info).
- Salary Management (Structures, Components, Revisions).
- Attendance, Leave, and LOP tracking.
- Payroll Calculation Engine (Earnings, Statutory Deductions, Net Salary, Employer Cost).
- Statutory Rules Configuration (EPF, ESI, PT, LWF, TDS).
- Payroll Workflow (Review, Approval, Finalization, Lock).
- Payslip Generation and PDF Export.
- Reporting Engine (Payroll Register, Tax Reports, Compliance).

## Proposed Database Changes
New tables to be added to Convex schema (all must be workspace-scoped with `workspaceId`):
- `employees`, `departments`, `designations`.
- `salaryStructures`, `salaryComponents`, `salaryRevisions`.
- `attendance`, `leaveTypes`, `leaveRequests`, `overtime`, `lopEntries`.
- `payrollRuns`, `payrollEmployees`, `payrollComponents`, `payslips`.
- `statutoryRules`, `taxDeclarations`, `taxProofs`.
- `reimbursements`, `loans`.
- `complianceReports`.

## Proposed Route and Navigation Structure
Update `apps/app/src/app/[locale]/(dashboard)` navigation to include:
- **Dashboard**: Overview, Payroll Cost, Approvals.
- **Employees**: Directory, Add, Departments, Designations.
- **Payroll**: Runs, Structures, Payslips, History.
- **Attendance**: Leave, Overtime, LOP.
- **Compliance**: PF, ESI, PT, TDS.
- **Reports**: Salary Register, Tax Reports.
- **Settings**: Company, Statutory Rules, Users & Roles.

## Security Considerations
- **Tenant Isolation**: Every payroll and employee record must strictly reference `workspaceId` to prevent cross-company data leakage.
- **Role-based Access Control (RBAC)**: Existing `"owner"`, `"admin"`, `"member"` roles need to be mapped to Payroll specific roles (Admin, HR, Finance, Manager, Employee) or expanded.
- **Data Immutability**: Finalized payrolls must be locked. Salary revisions shouldn't overwrite historical payslips.
- **Sensitive Data**: PAN, bank details, and salary figures must be guarded securely and excluded from unnecessary API payloads.

## Testing and Deployment Approach
- **E2E Testing**: Exists in `e2e/` folder using Playwright (covering auth, IDOR, dashboard functionality). New E2E workflows should be added for the payroll lifecycle.
- **Unit/Integration Testing**: Vitest is configured for the backend (`packages/backend/vitest.config.ts`). Essential for testing deterministic payroll formulas and statutory calculations.
- **Lint/Build**: Biome is used for formatting/linting, `turbo` for orchestrated builds.

## Risks, Assumptions, and Unresolved Questions
- **Risk**: Payroll calculation requires high precision. Floating-point errors in JavaScript might occur; we should manage calculations cautiously.
- **Risk**: Storing PDFs/Payslips requires storage limits; Convex file storage is available, but space constraints need monitoring.
- **Assumption**: We assume the existing UI theme is acceptable and we just need to adapt it.
- **Unresolved Question**: Will the system need an expanded Role model beyond `owner, admin, member` right away (e.g., HR, Finance)? 

## Recommended Implementation Sequence
1. **Phase 1**: Product Foundation (Branding, Navigation, Dashboard layout, Role structure).
2. **Phase 2**: Employee Management (CRUD, Schema).
3. **Phase 3**: Salary Management.
4. **Phase 4**: Attendance & Leave.
5. **Phase 5**: Payroll Engine.
6. **Phase 6**: Payroll Workflow.
7. **Phase 7**: Payslips & Reports.
8. **Phase 8**: Employee Self-Service.
