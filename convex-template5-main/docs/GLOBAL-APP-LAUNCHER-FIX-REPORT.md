# GLOBAL NINE-DOT APP LAUNCHER FIX REPORT
**Module:** Global Navigation / Shared Application Shell  
**Reference Tenant:** Authenticated Victor Chasex greytHR (`https://victorchasex.greythr.com/ngapp/leave/main/overview`)  
**Scope:** Admin Welcome, Employee, Payroll, Workforce Management, Workflow, Reports, Engage, Unite, Settings  
**Date:** November 19, 2026  

---

## 1. Root Cause Analysis

### Identified Flaws
1. **Prop Interface Mismatch**:
   - `AdminTopbar` passed `<QuickLauncherModal isOpen={launcherOpen} onClose={() => setLauncherOpen(false)} />`.
   - `QuickLauncherModalProps` strictly expected `{ open: boolean, onOpenChange: (open: boolean) => void }`.
   - As a result, `open` evaluated to `undefined` (falsy) inside `QuickLauncherModal`, causing `if (!open) return null;` to permanently hide the dropdown panel even when clicked.
2. **One-Way State Setter vs Toggle**:
   - The launcher button in `AdminTopbar` had `onClick={() => setLauncherOpen(true)}` rather than toggling `setLauncherOpen((prev) => !prev)`. Clicking the button a second time failed to dismiss the menu.
3. **Outside Click Race Condition**:
   - The document `mousedown` listener lacked an explicit click-boundary guard for the launcher button. Any click on the button while open would trigger the outside-click handler and toggle event simultaneously.
4. **Outdated Application Route Destination**:
   - The "Workflow" application entry pointed to legacy `/attendance?tab=leaves` instead of the canonical `/admin/workflow/leave` route.

---

## 2. Changes Applied

### A. Component Flexibility & Prop Unification (`quick-launcher-modal.tsx`)
- Extended `QuickLauncherModalProps` to accept both conventions:
  ```ts
  export interface QuickLauncherModalProps {
    open?: boolean;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onClose?: () => void;
  }
  ```
- Evaluated visibility as `const isVisible = open ?? isOpen ?? false;`.
- Implemented `handleClose()` to trigger both `onOpenChange?.(false)` and `onClose?.()`.
- Added click-boundary exclusion in `handleClickOutside` for `button[title="Apps"], button[aria-label="Apps"]`.

### B. Canonical Application Mapping & Order
Verified all 8 applications match the reference greytHR launcher order with Lucide icons and exact styling:
1. **Homepage** (`/`)
2. **Employee** (`/admin/employee/main/overview`)
3. **Payroll** (`/admin/payroll`)
4. **Workforce Management** (`/admin/leave/overview`) with subtitle *"Formerly Leave & Attendance"*
5. **Workflow** (`/admin/workflow/leave`)
6. **Reports** (`/reports`)
7. **Engage** (`/engage`)
8. **Unite Marketplace** (`/admin/unite`)

### C. Topbar Toggle Integration (`admin-topbar.tsx` & `topbar.tsx`)
- Updated launcher button click handlers to `setLauncherOpen((prev) => !prev)`.
- Bound both `open` and `isOpen` props to `QuickLauncherModal`.

---

## 3. Verification & Evidence

### 3.1 Live Browser CDP Verification
- Attached to active Chrome session on port 9222.
- Navigated to `http://localhost:3000/admin/leave/overview`.
- Clicked 9-dot launcher button:
  - Dropdown opened beneath the icon displaying **"Your Apps"** header and all 8 applications.
  - Tested Escape key press: Dropdown dismissed cleanly (`Is Panel Open after Escape: false`).
- Tested Multi-Hop Cross-Module Navigation:
  - From Workforce Management -> Click Reports -> Successfully navigates to `/reports`.
  - From Reports -> Click Launcher -> Click Payroll -> Successfully navigates to `/admin/payroll`.

### 3.2 Screenshots Captured
- 1920×1080 (Launcher Opened): [indiapay-launcher-open-1920x1080.png](file:///C:/Users/nirma/.gemini/antigravity/brain/dfff8ff6-9284-4952-899a-e09c886e427e/indiapay-launcher-open-1920x1080.png)
- 1366×768 (Launcher Opened): [indiapay-launcher-open-1366x768.png](file:///C:/Users/nirma/.gemini/antigravity/brain/dfff8ff6-9284-4952-899a-e09c886e427e/indiapay-launcher-open-1366x768.png)

### 3.3 Test Suite Execution
- **Dedicated Test**: `tests/global-app-launcher.test.js` (5 / 5 subtests passed).
- **Platform Regression Run**: **19 / 19 Test Suites Passed (100%)**.
