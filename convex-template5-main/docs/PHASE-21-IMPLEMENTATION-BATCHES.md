# INDIA PAY — PHASE 21 IMPLEMENTATION BATCHES & EXECUTION PLAN

**Project:** IndiaPay HRMS  
**Strategy:** Phased, Independently Testable Engineering Batches  
**Target:** 100% Verified greytHR Feature & Architectural Parity  
**Date:** November 19, 2026  

---

## Batch Overview & Sequence

```
[Batch P0: Security & Backend Core] 
                 │
                 ▼
[Batch P1: Core Payroll & Financial Settlement] 
                 │
                 ▼
[Batch P2: Statutory Labor Acts & Forms] 
                 │
                 ▼
[Batch P3: System Settings Submenus Expansion] 
                 │
                 ▼
[Batch P4: Sys Admin Backroom & Diagnostics] 
                 │
                 ▼
[Batch P5: Visual Parity & Full Platform Sign-off]
```

---

## Batch P0 — Security, Convex Backend & Tenant Isolation Core (Foundation)
- **Objective:** Finalize underlying schema models and server-side RBAC guards.
- **Scope & Deliverables:**
  1. Add tables in `schema.ts`: `loans`, `loanRepayments`, `reimbursementClaims`, `fnfSettlements`, `emailLogs`, `userImpersonationSessions`.
  2. Maintain zero regressions across all 21 test suites.
- **Acceptance Gate:** `npx convex dev --once` succeeds, and schema tables compile cleanly.

---

## Batch P1 — Core Payroll Calculations, F&F, Loans, Reimbursements & Tax (High Priority)
- **Objective:** Elevate core financial and payroll workflows from PARTIAL to 100% VERIFIED.
- **Scope & Deliverables:**
  1. **Full & Final Settlement (F&F)**:
     - End-to-end settlement wizard on `/admin/payroll/information`.
     - Automated leave encashment: `(Remaining Earned Leaves * Basic Salary) / 30`.
     - Statutory gratuity formula: `(15 * Last Drawn Basic * Tenure in Years) / 26` (for employees with >= 5 years service).
     - Notice period shortfall deductions and asset clearance checks.
  2. **Loan Management & Automatic EMI Deduction**:
     - Loan application, approval, and EMI schedule generation.
     - Integration hook into `packages/backend/convex/payroll.ts` to auto-deduct active loan EMIs from monthly pay runs.
  3. **Reimbursements & Claims Vouchers**:
     - Employee bill uploads, manager approval workflow, and taxable vs non-taxable payout inclusions.
  4. **Income Tax Declarations & Section 80C Masters**:
     - Section 80C (Rs 1.5 Lakh limit), Section 80D medical, HRA exemption (Rule 2A), and automated comparison of Old vs New Tax Regime liabilities.
- **Acceptance Gate:** All salary deductions, EMI recoveries, and F&F calculations verified with automated integration tests.

---

## Batch P2 — Statutory Labor Law Reports & Multi-Page PDF Form Engines
- **Objective:** Convert the 67 UI-ONLY Reports Gallery items to specialized statutory legal form exports.
- **Scope & Deliverables:**
  1. **Karnataka Factories Act Form 22**: Multi-page annual return with person-days worked, adult headcounts, and accident summaries.
  2. **CLRA Act Form XVII**: Register of wages for contract laborers with gross earnings and piece-rate calculations.
  3. **Minimum Wages Rules Form V**: Register of overtime hours (2x hourly rate), deductions, and fines.
  4. **Payment of Bonus Act Form D**: Annual bonus register (8.33% statutory minimum to 20% maximum).
  5. **LWF Form A**: Labour Welfare Fund remittance statements for Karnataka and Tamil Nadu.
- **Acceptance Gate:** Real PDF and Excel exports generate formatted statutory returns matching official state labor templates.

---

## Batch P3 — Granular System Settings Expansion
- **Objective:** Progressively implement dedicated pages for the remaining 151 System Settings submenus.
- **Scope & Deliverables:**
  1. **General Settings (32 Submenus)**: Company Signatories, Locations, Document Templates, Email Alerts.
  2. **Payroll Settings (28 Submenus)**: Pay Group creation, Salary Component formulas, Reimbursement heads.
  3. **Income Tax Settings (11 Submenus)**: Tax slabs, Chapter VI-A allowable limits.
  4. **Leave Settings (24 Submenus)**: Leave Schemes, Encashment policies, Compensatory off rules.
- **Acceptance Gate:** Dedicated settings pages save directly to Convex with zero unpersisted mock fallbacks.

---

## Batch P4 — Sys Admin Backroom & Diagnostics
- **Objective:** Replicate greytHR backroom administrative tools.
- **Scope & Deliverables:**
  1. **Minor Puppetry (User Impersonation)**: Super Admin can view the dashboard as any employee with a prominent floating audit banner (`Currently viewing as [Employee Name] - Exit Impersonation`) and strict read-only safety guards.
  2. **SMTP Email Delivery Logs**: Real-time audit dashboard of sent payslips, onboarding invites, and password resets.
- **Acceptance Gate:** Impersonation and email logging verified in browser without credential exposure.

---

## Batch P5 — Visual Parity Polish & Final Verification
- **Objective:** Final UI alignment and regression audit.
- **Scope & Deliverables:**
  1. Full screenshot diff comparisons at 1920×1080 and 1366×768.
  2. Final regression audit across all test suites.
- **Acceptance Gate:** 100% of the 421 catalogued features marked VERIFIED with passing regression tests.
