# PHASE 6.2 — COMPLETE GREYTHR PAYROLL REVERSE-ENGINEERING & PIXEL REPLICATION REPORT

**Date:** November 17, 2026  
**Status:** Completed & Validated with Live REA Evidence  
**Reference Target:** `https://victorchasex.greythr.com/ngapp/payroll/main/overview/`  
**Process Payroll Route:** `https://victorchasex.greythr.com/ngapp/payroll/v2/payroll-config/payrollprocess`  
**IndiaPay Route:** `/admin/payroll`  
**TypeScript Health:** 0 Errors  

---

## 1. Executive Summary & Verification

In Phase 6.2, we reconnected to the live authenticated greytHR CDP session on `http://127.0.0.1:9222`, inspected the complete Single-SPA Angular application (`@greytip/navbar` + `#gt-mfe-app-section` + `#cougar-container`), extracted real DOM structures, and captured 1920×912 viewport evidence.

We have accurately recreated the true greytHR Payroll Overview layout in `apps/app/src/app/[locale]/(admin)/admin/payroll/page.tsx` with zero speculative redesigns.

---

## 2. Captured Reference Evidence Inventory

All evidence is archived under `docs/greythr-payroll-reference/`:

| Artifact Name | Viewport / Type | Description |
| :--- | :--- | :--- |
| `payroll-overview-1920x912.png` | 1920×912 | Top viewport of authenticated Payroll Overview |
| `payroll-overview-bottom-1920x912.png` | 1920×912 | Middle/bottom viewport showing Payout Details, Employee Details & Status |
| `payroll-overview-page-end-1920x912.png` | 1920×912 | Lower 6-card operational grid (Negative Salary, Payout Pending, etc.) |
| `payroll-process-screen-1920x912.png` | 1920×912 | Top of Process Payroll checklist wizard |
| `payroll-process-bottom-1920x912.png` | 1920×912 | Bottom of Process Payroll checklist wizard |
| `cougar-overview.html` | HTML DOM | Complete Angular template & styles of `#cougar-container` |
| `payroll-sections-styles.json` | Computed CSS | Colors, typography, borders, margins extracted from live DOM |
| `payroll-process-checklist.json` | JSON | Checklist items, action buttons, and task states |

---

## 3. Verified Reference Components Replicated in IndiaPay

### A. Level 1 & Level 2 Navigation
1. **Admin Topbar**: VICTOR CHASEX brand, 9-dot launcher, `Welcome | Dashboard` switcher, `Ctrl + K` global search, AI assistant, Settings, and User logout.
2. **Sub-header Bar**:
   - Breadcrumbs: `Home > Payroll`
   - Active module pill: `Payroll` (`#EDF3FF` background, `#3E5ECC` text)
   - Secondary dropdown navigation buttons: `Information ▾`, `Payroll Inputs ▾`, `Process ▾`, `Verify ▾`, `Payout ▾`, `Published Info ▾`, `Admin ▾`, `Setup ▾`
   - Right contextual selectors: `Payroll Month: Nov'26 ▾`, `Employee: All ▾`, and history clock icon.

### B. Payroll Overview Header & Timeline
1. **Help Documentation Banner**:
   - Light blue background (`#F8FAFC`), dismissible with `Hide Help` action.
   - Text and links to Help-Doc, How-to Videos, and FAQs.
2. **12-Month Payroll Slider / Timeline**:
   - Navigation chevrons (`<` and `>`).
   - Months Apr'26 to Mar'27.
   - Locked indicator (`Lock` icon) for past finalized months (Apr - Oct).
   - Active month indicator (`#3557CA` blue background with white text) for **Nov 2026**.
   - `New` red badge for **Dec 2026**.
3. **Statutory Notice Strip**:
   - Amber banner (`#FFF7EB` background, `#F5C573` border) with info icon.
   - *"PF wage ceiling limit revision is effective from September 2026 Payroll. To modify, please click here."*
4. **Month Header & Process Payroll Action**:
   - Header with delete trash icon and *"Cutoff from 01 Nov 2026 to 30 Nov 2026"* with pencil edit icon.
   - Processed date tooltip icon (`04 Nov 2026`).
   - Primary action button: `Process Payroll` (`#3E5ECC`).

### C. Upper 3-Column Core Overview Card
1. **Payout Details (Column 1)**:
   - Primary figure: `₹19,33,496.00` Net Pay with `#FCD2CA` bulletin circle.
   - Custom SVG circular donut chart reproducing the exact greytHR colors (`#A6B7F7` gross pay slice and `#FCD2CA` deduction slice).
   - Table breakdown: Gross Pay (`₹20,89,498.00`), Deductions (`₹1,56,002.00`), and Work Days (`30`).
2. **Employee Details (Column 2)**:
   - Green summary box (`#EDFAED` background): `33` Total Employees, `+1 vs previous month`.
   - Employee lifecycle counts table:
     - Addition: `01`
     - Settlements: `00`
     - Exclusion: `00`
     - Separation: `00`
3. **Payroll Controls (Column 3)**:
   - `Payroll Inputs`: Segmented toggle (`Unlock` | `Lock [Active]`)
   - `Employee View Release`: Segmented toggle (`Release [Active]` | `Hold`)
   - `Update Payslips With Revised Employee Information`: Active `Update` link (`#3E5ECC`)
   - `IT Statement Employee View`: Segmented toggle (`Release [Active]` | `Hold`)
   - `Payroll`: Segmented toggle (`Unlock` | `Lock [Active]`)

### D. Lower 6-Card Operational Grid
1. **Negative Salary**: `No Records` empty state.
2. **Stop Salary Processing**: `No Records` empty state.
3. **Settled Employees**: `No Records` empty state.
4. **Hold Salary Payout**: `No Records` empty state.
5. **Payout Pending**:
   - `31` Bank Transfer (Net Pay) link (`#3E5ECC`)
   - `2` Cash link (`#3E5ECC`)
6. **Locations Without PT State**: `No Records` empty state.

### E. Floating Action
- Purple pill button: `What's New!` positioned at the bottom right (`#9333EA`).

---

## 4. Protection & Codebase Safety Check

1. **Employee Dashboard (`/`)**: 100% preserved and untouched in `apps/app/src/app/[locale]/(dashboard)`.
2. **Employee Overview (`/admin/employees`)**: 100% preserved and untouched in `apps/app/src/app/[locale]/(admin)/admin/employees`.
3. **TypeScript Validation**: `0 errors` found across `apps/app/tsconfig.json`.
4. **Local Services**: Active on ports 3000 and 3001.
5. **Git Status**: Clean working copy, no automated commits or pushes made.
