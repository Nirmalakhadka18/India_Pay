# Phase 1 Plan: Product Foundation

## Objective
Establish the foundational structure of the IndiaPay application by setting up product branding, updating the navigation layout, redesigning the dashboard, updating company settings, establishing payroll settings, and expanding the role structure.

## UI Scope
1. **Product Branding**: Update logos, titles, and themes to match "IndiaPay" branding instead of the default template.
2. **Navigation**: Redesign the sidebar in the dashboard layout to include:
   - Dashboard
   - Employees
   - Payroll
   - Attendance
   - Compliance
   - Reports
   - Settings
3. **Dashboard View**: Update the main dashboard view to show payroll-centric widgets (e.g., Active Employees, Gross Payroll, Net Payroll, Pending Approvals) instead of generic template stats.
4. **Settings Modules**:
   - Update existing workspace/company settings to fit payroll context.
   - Add placeholders for Payroll Settings and Statutory Rules.

## Backend Scope
1. **Role Structure Expansion**:
   - Update the `Role` type definition to include: `owner`, `admin`, `hr`, `finance`, `manager`, `employee`.
   - Update the `requireMember` and `requireRole` middleware checks to support these new granular roles.
2. **Dashboard Backend**:
   - Update or mock dashboard data queries (`dashboard.stats`) to return payroll-centric counts.
3. **Organizations (Tenants)**:
   - Ensure organization creation continues to work smoothly with the new roles.

## Proposed File Changes
- **`apps/app/src/app/[locale]/layout.tsx`**: Update metadata for "IndiaPay" branding.
- **`packages/ui/src/components/logo.tsx`**: Update the application logo.
- **`apps/app/src/app/[locale]/(dashboard)/layout.tsx`**: Overhaul the sidebar navigation links.
- **`apps/app/src/app/[locale]/(dashboard)/page.tsx`**: Update the UI of the main dashboard to reflect payroll metrics.
- **`apps/app/src/app/[locale]/(dashboard)/settings/...`**: Extend settings pages to include Company and Payroll settings navigation.
- **`packages/backend/convex/orgs.ts`**: Update the `Role` type and relevant permission helpers (`requireRole`, `requireMember`).
- **`packages/backend/convex/schema.ts`**: If `role` is explicitly typed in the schema (currently it's `v.string()`), update validation logic.
- **`packages/backend/convex/dashboard.ts`**: Update the stats query to return relevant initial metrics.

## Tests & Acceptance Criteria
- **Tests**: Ensure Playwright E2E tests (`p-sidebar.js`, `p-home.js`, `p-notif.js`, etc.) pass with the updated DOM selectors and navigation paths. Run backend unit tests (`vitest`).
- **Acceptance Criteria**:
  1. Application starts successfully (`npm run dev`).
  2. Login works without any auth regression.
  3. Organization (Workspace) creation works properly.
  4. The dashboard displays the new Indian Payroll navigation sidebar.
  5. The dashboard widgets show the new metrics layout.
  6. Existing tenant isolation and authorization are fully maintained.
