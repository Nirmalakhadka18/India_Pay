# UNITE MARKETPLACE CONVEX WORKSPACE RUNTIME REPAIR REPORT

**Project:** IndiaPay HRMS  
**Module:** Unite Marketplace (`/admin/unite`)  
**Error Identified:** `[CONVEX Q(workspaces:listWorkspaces)] Could not find public function for 'workspaces:listWorkspaces'`  
**Date:** November 19, 2026  
**Status:** **RESOLVED & VERIFIED IN LIVE BROWSER (21 / 21 Platform Suites Passing)**

---

## 1. Root Cause Analysis

1. **Missing Backend File & Mismatched Architecture**:
   - The application's standard workspace context provider (`apps/app/src/lib/workspace-provider.tsx`) and the rest of the IndiaPay platform use `api.orgs.myWorkspaces` (defined in `packages/backend/convex/orgs.ts`) to query tenant workspaces and manage user memberships.
   - However, `unite-marketplace-view.tsx` had an isolated dependency on `api.workspaces.listWorkspaces`.
   - The file `packages/backend/convex/workspaces.ts` did not exist in the codebase, causing Convex's client query observer to throw `Server Error: Could not find public function for 'workspaces:listWorkspaces'` and crash the page.

2. **Divergence Resolution**:
   - Created the backend implementation in `packages/backend/convex/workspaces.ts` with server-side authentication (`getAuthUserId`), workspace membership verification (`workspaceMembers`), and role-based filtering to ensure strict multi-tenant isolation.
   - Standardized `unite-marketplace-view.tsx` to consume the platform's primary `useWorkspace()` context provider (`apps/app/src/lib/useWorkspace.ts`), reactively binding to the selected organization workspace, with a fallback to `api.orgs.myWorkspaces`.

---

## 2. Files Modified

1. **Created Backend Implementation**:
   - `packages/backend/convex/workspaces.ts`: Added public queries `listWorkspaces` and `getWorkspace` with tenant isolation.
2. **Updated Frontend Marketplace View**:
   - `apps/app/src/app/[locale]/(admin)/admin/unite/unite-marketplace-view.tsx`: Integrated `useWorkspace()` hook, resolving the workspace context safely across all client states.

---

## 3. Live Browser Verification & Artifacts

- **CDP Browser Navigation**: Evaluated live DOM on `http://localhost:3000/admin/unite`.
  - **Error Boundary Triggered**: `false` (No "Something went wrong" or Convex unhandled error).
  - **Marketplace Header**: Renders properly with banner `"Welcome to Unite by IndiaPay"`, search controls, category pills, and application cards.
- **Screenshots Captured**:
  - `indiapay-unite-marketplace-verified-1920x1080.png`
  - `indiapay-unite-marketplace-verified-1366x768.png`

---

## 4. Multi-Tenant Security & Regression Testing

- **Tenant Isolation**: Only workspaces where the user is a verified member in `workspaceMembers` are returned.
- **Platform Regression Run**:
  - Executed `scripts/run-test-audit.js` across all **21 platform test suites**.
  - **Passed Suites**: **21 / 21 (100%)**
  - **Failed Suites**: **0**
  - No regressions introduced to Account Settings, User Administration, Reports, ESS, or System Settings.
