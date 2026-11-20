# INDIA PAY — PRIORITIZED IMPLEMENTATION ROADMAP (P0 TO P4)

**Project:** IndiaPay HRMS  
**Post-Audit Phase:** Phased Engineering Roadmap towards 100% greytHR Parity  
**Date:** November 19, 2026  

---

## Phase Overview & Dependency Hierarchy

```
[P0: Backend & Security Core]
             │
             ▼
[P1: Core Payroll & Settlement Engine]
             │
             ▼
[P2: Statutory Returns & State Labor Acts]
             │
             ▼
[P3: Advanced System Settings Expansion]
             │
             ▼
[P4: Sys Admin Backroom & Diagnostics]
```

---

## 1. P0 — Critical Security, Data Integrity & Backend Core (Immediate Priority)
- **Objective:** Ensure all existing operational pages have direct remote Convex persistence with zero unhandled client queries.
- **Tasks:**
  1. Add schema tables for `loans`, `reimbursementClaims`, and `emailLogs`.
  2. Maintain 100% test pass rate across the 21 platform regression suites.
- **Dependencies:** None.

## 2. P1 — Core HRMS, Full & Final Settlement (F&F) and Loan Engines
- **Objective:** Elevate partial payroll workflows to 100% verified status.
- **Tasks:**
  1. Implement automated F&F Settlement calculator (encashment, gratuity formula, notice pay deduction).
  2. Implement Loan amortization schedule engine and monthly payroll deduction hook.
  3. Implement Reimbursement voucher claim submission and manager approval pipeline.
- **Dependencies:** P0 schema models.

## 3. P2 — Indian Statutory Compliance & State Labor Act Forms
- **Objective:** Convert the 67 "UI ONLY" Reports Gallery statutory reports to specialized multi-page PDF/XLSX forms.
- **Tasks:**
  1. Form 22 (Karnataka Factories Act Annual Return).
  2. Form XVII / XVI (Contract Labour Regulation & Abolition Act Wage Register).
  3. Form V (Karnataka Minimum Wages Rules Overtime & Fine Register).
  4. Form D (Payment of Bonus Act Annual Bonus Register).
  5. Form A (Karnataka & Tamil Nadu Labour Welfare Fund Statement).
- **Dependencies:** P1 payroll calculation outputs.

## 4. P3 — Advanced System Settings Granular Expansion
- **Objective:** Progressively implement dedicated pages for the remaining 151 System Settings submenus.
- **Tasks:**
  1. General Settings batch (32 submenus): Company Signatories, Locations, Document Templates.
  2. Payroll Settings batch (28 submenus): Statutory PF/ESI/PT rules master, Pay Group creation.
  3. Income Tax Settings batch (11 submenus): Tax slabs, Chapter VI-A allowable limits.
  4. Leave Settings batch (24 submenus): Leave Schemes, Encashment policies.
- **Dependencies:** Core shared System Settings layout.

## 5. P4 — Sys Admin Backroom & Diagnostic Utilities
- **Objective:** Replicate greytHR backroom administrative tools.
- **Tasks:**
  1. Implement Super Administrator user impersonation ("Minor Puppetry") with visible audit banner.
  2. Implement outbound SMTP email queue and delivery log table.
- **Dependencies:** User administration & RBAC models.
