# PHASE 6.1 — STRICT GREYTHR PAYROLL VISUAL FIDELITY AUDIT

**Date:** November 17, 2026  
**Audited Target:** `apps/app/src/app/[locale]/(admin)/admin/payroll/page.tsx`  
**Reference Evidence Directory:** `docs/greythr-payroll-reference/`  
**Reference Viewport:** 1920×912 (`payroll-overview-1920x912.png`)  
**Reference URL:** `https://victorchasex.greythr.com/ngapp/payroll/main/overview/`  

---

## 1. Audit Matrix: Implementation vs. Saved greytHR Reference

This audit evaluates every component currently in `apps/app/src/app/[locale]/(admin)/admin/payroll/page.tsx` against the actual computed styles, DOM extraction (`payroll-dom.json`), accessibility tree (`payroll-accessibility.json`), and reference screenshot (`payroll-overview-1920x912.png`).

| Component / Element | Current Implementation State | Reference Status in greytHR | Classification | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Top Admin Bar** (VICTOR CHASEX, Search, AI, Settings, Logout) | Implemented via `AdminTopbar` | Present in reference DOM (`gt-nav-bar-shadow`, `css-0`) | **Verified match** | Retain exact layout |
| **Breadcrumb** (`Home > Payroll`) | Implemented at top left | Present in reference a11y tree & DOM (`Home > Payroll`) | **Verified match** | Retain exact styling |
| **Active Module Pill** (`Payroll`) | Implemented (`#E0F2FE`, `#0284C7`) | Present in reference navbar | **Verified match** | Retain exact styling |
| **Secondary Dropdowns** (`Information`, `Payroll Inputs`, `Process`, `Verify`, `Payout`, `Published Info`, `Admin`, `Setup`) | Implemented as text buttons with chevron | Present in reference a11y tree (`role: button`) | **Verified match** | Retain |
| **Contextual Selectors** (`Payroll Month: Nov'26`, `Employee: All`, Clock icon) | Implemented on top right | Present in reference screenshot & a11y tree | **Verified match** | Retain |
| **Floating Action Badge** (`What's New!`) | Implemented at bottom right (`#9333EA`) | Present in reference screenshot & a11y tree | **Verified match** | Retain |
| **Total Gross Pay KPI Card** | Implemented (`₹2,089,499.00`) | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |
| **Net Pay Outflow KPI Card** | Implemented (`₹1,842,120.00`) | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |
| **Statutory Deductions KPI Card** | Implemented (`₹247,379.00`) | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |
| **Employees in Payroll KPI Card** | Implemented (`33`) | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |
| **Five-step Processing Pipeline Stepper** | Implemented (Inputs → Changes → Computation → Audit → Payout) | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |
| **Process Payroll Status Banner** | Implemented ("Payroll for Nov'26 is Ready to Process") | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |
| **Sync Attendance & Leaves Button** | Implemented in banner | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |
| **Primary Operations Cards** (Process Payroll, Salary Revision, Form 16) | Implemented as 3 action cards | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |
| **Monthly Input Verification Checklist** | Implemented (5 checklist items) | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |
| **Key Payroll Reports Card** (Salary Register, PF ECR, ESI, Bank Advice) | Implemented in right column | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |
| **Payroll Compliance Guide Card** | Implemented in right column | **NOT PRESENT** in reference screenshot | **Unsupported assumption** | **REMOVE** |

---

## 2. In-Depth Analysis of greytHR Reference Evidence

### Reference Viewport Inspection (`payroll-overview-1920x912.png` & `payroll-dom.json`):
1. **The Header & Secondary Navbar**:
   - The top header (`#single-spa-application:@greytip/navbar`) contains:
     - 9-dot launcher, VICTOR CHASEX logo.
     - Active tab `Payroll`.
     - Dropdown navigation menus: `Information ▾`, `Payroll Inputs ▾`, `Process ▾`, `Verify ▾`, `Payout ▾`, `Published Info ▾`, `Admin ▾`, `Setup ▾`.
     - Global search bar (`Search Anything`, `Ctrl + K`), AI icon, Settings gear, Logout.
     - Sub-header bar containing breadcrumb `Home > Payroll` on the left, and on the right:
       - `Payroll Month: Nov'26 ▾`
       - `Employee: All ▾`
       - History icon (clock)
2. **The Content Area (`#gt-mfe-app-section`)**:
   - In `payroll-dom.json`, `#single-spa-application:gt-cougar-payroll` (`cougar-container`) has height `0` / empty inner view when captured.
   - In `payroll-overview-1920x912.png`, the entire viewport below the sub-header is a clean, neutral background (`rgb(247, 247, 247)` / `#F7F7F7`) with the floating purple `What's New!` badge at the bottom right.
   - **Conclusion**: The generic dashboard widgets (KPI cards, 5-step stepper, input verification checklist, report download blocks) were assumed based on standard payroll workflows, but are **NOT** in the actual greytHR reference screenshot or DOM. They represent speculative redesigns that violate the strict replication mandate.

---

## 3. Reference Workflow Accessibility Limitations

During the Phase 6 live REA inspection:
- The authenticated greytHR browser session expired and redirected to `victorchasex.greythr.com/uas/portal/auth/login`.
- **Process Payroll**, **Salary Revision**, and **Form 16** sub-routes were **NOT** accessible prior to session expiry and have **NOT** been captured under `docs/greythr-payroll-reference/`.
- Status: **NOT ACCESSIBLE / PENDING AUTHENTICATED SESSION**.
- No synthetic or speculative UI will be invented for these sub-routes until authenticated CDP access is re-established and verified.

---

## 4. Remediation Plan

1. **Remove all speculative widgets**:
   - Strip out Total Gross Pay, Net Pay Outflow, Statutory Deductions, Employees in Payroll KPI cards.
   - Strip out 5-step processing pipeline stepper.
   - Strip out Process Payroll action cards and Checklist widgets.
   - Strip out Reports sidebar and Help sidebar.
2. **Align precisely with `payroll-overview-1920x912.png`**:
   - Retain the exact pixel-level Admin Topbar and secondary navigation bar.
   - Retain the breadcrumbs and selectors (`Payroll Month: Nov'26`, `Employee: All`, History).
   - Render the genuine empty/clean overview container matching `payroll-dom.json` with `#F7F7F7` background.
   - Retain the floating `What's New!` badge matching the exact coordinates and color.
3. **Capture Side-by-Side & Difference Evidence**:
   - Capture IndiaPay at 1920×912 and compare against `payroll-overview-1920x912.png`.
