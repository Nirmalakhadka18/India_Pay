# Phase 13 — Reports & Analytics Test Results & Feature Matrix
**IndiaPay HRMS**  
**Date:** November 18, 2026  
**Execution Environment:** Node.js v26.13.1, Next.js 15, Convex Backend, CDP Chrome  

---

## 1. Feature Verification Matrix

Each report and module has been evaluated and classified strictly according to the verification standards:
- **VERIFIED**: Fully backed by Convex queries/mutations, UI interactions, preview tables, filtering, and export capability.
- **DRAFT STATUTORY**: Generated using real internal payroll calculations but explicitly designated as draft/audit review only to prevent unintended live portal submissions.
- **PARTIAL**: Interface and data schema ready; requires specialized third-party external integrations or advanced physical forms.

| Component / Report Name | Route / Category | Classification | Verification Notes |
| :--- | :--- | :--- | :--- |
| **Reports Gallery Shell** | `/admin/reports` | **VERIFIED** | 3-column masonry layout, real-time client search, category pill filters, and favorites filtering. |
| **Favorite Report Toggle** | `/admin/reports` | **VERIFIED** | Backed by Convex mutation `reports.toggleFavorite` with tenant isolation. |
| **Report Execution Engine** | `/admin/reports` | **VERIFIED** | Modal parameter selection, tabular data preview, and instant download generation. |
| **Multi-Format Export (CSV, XLSX, PDF)** | `/admin/reports` | **VERIFIED** | Client-side export engines generating authentic formatted files. |
| **Recent Execution History** | `/admin/reports/recent` | **VERIFIED** | Persisted Convex audit logs (`reportRuns`) showing user, parameters, row counts, and status. |
| **Ad-Hoc Query Builder** | `/admin/reports/querybuilder` | **VERIFIED** | 4-step wizard with source selection, allowlisted field projection, conditions, sorting, and Convex persistence. |
| **Preloaded Reference Templates** | `/admin/reports/querybuilder` | **VERIFIED** | 4 pre-configured greytHR templates: Bank Details, Emergency Contact, Basic Info, Statutory KYC. |
| **Advanced Analytics Hub** | `/admin/reports/analytics` | **VERIFIED** | Live KPI tiles, active headcount cards, department distribution, and payroll trends. |
| **Legacy Statutory Route** | `/(dashboard)/reports` | **VERIFIED** | EpfoEcrDialog, Form138TdsDialog, PayslipModal, and StatutoryReportsSection preserved 100%. |
| **Monthly Salary Register** | Payroll Payout | **VERIFIED** | Employee gross, deductions, and net payout calculation. |
| **Bank Transfer Statement** | Payroll Payout | **VERIFIED** | Bank account numbers, IFSC codes, and net transfer amounts. |
| **Salary Variance Report** | Payroll Control | **VERIFIED** | Month-over-month salary delta comparison. |
| **EPFO Electronic Challan (ECR)** | PF (Provident Fund) | **DRAFT STATUTORY** | Formatted draft for internal validation before EPFO portal upload. |
| **ESIC Monthly Return** | ESI | **DRAFT STATUTORY** | Draft ESIC gross wages and contribution schedule. |
| **Karnataka Form 5A PT Return** | Professional Tax | **DRAFT STATUTORY** | Draft state slab calculations for Karnataka PT. |
| **Form 16 Part A & Part B** | Income Tax & TDS | **DRAFT STATUTORY** | Annual TDS summary and tax deduction breakdown. |
| **Employee Master Detailed Profile** | HR Operational | **VERIFIED** | Complete employee demographic, contact, and employment profile. |
| **Leave Balances Summary** | Leave & Attendance | **VERIFIED** | Leave quota, accrued balances, and consumed leave days. |
| **Minimum Wages Compliance Audit** | Compliance Audit | **PARTIAL** | Basic wages verified against standard schedules; complex municipal gazettes require periodic manual updates. |

---

## 2. Test Execution Results

### 1. Reports & Analytics Test Suite (`tests/reports-analytics.test.js`)
```
▶ Phase 13: Reports & Analytics Engine & Security Test Suite
  ✔ 1. Catalog Discovery: 14 enterprise categories present with statutory tagging (1.0144ms)
  ✔ 2. Persistence: Favorites and report run logging isolation (0.3362ms)
  ✔ 3. Query Builder: Allowlisted projection and filter constraints (0.2597ms)
  ✔ 4. RBAC & Masking: Non-admin salary and KYC masking (0.9822ms)
  ✔ 5. Route Coexistence: Canonical /admin/reports and statutory /(dashboard)/reports (0.4174ms)
✔ Phase 13: Reports & Analytics Engine & Security Test Suite (6.5428ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

### 2. Workflow Management Comprehensive Suite (`tests/workflow-modules-comprehensive.test.js`)
```
▶ Workflow Management Comprehensive Module Test Suite (11 Modules)
  ✔ 1. Leave Workflow: Review mutation and status transitions
  ✔ 2. Comp-Off Workflow: Grant review and balance accrual
  ✔ 3. Restricted Holiday Leave: Quota cap enforcement (max 2)
  ✔ 4. Leave Cancel Workflow: Cancellation and balance ledger restoration
  ✔ 5. Help Desk Workflow: Category validation, ticket SLA and resolution
  ✔ 6. Employee Onboarding Workflow: Checklist creation and HR sign-off
  ✔ 7. Resignation Workflow: Notice period and Last Working Day (LWD) calculation
  ✔ 8. Confirmation Workflow: Probation assessment and extension evaluation
  ✔ 9. Workflow Delegates Setup: Conflict detection and self-delegation prevention
  ✔ 10. Workflow Reviewer Types Setup: Hierarchy classification and role definitions
  ✔ 11. Workflow Levels Setup: Multi-tier escalation chains and SLA thresholds
  ✔ 12. Workflow Security: Cross-tenant data isolation and RBAC
✔ Workflow Management Comprehensive Module Test Suite (11 Modules)
ℹ tests 13
ℹ pass 13
ℹ fail 0
```

### 3. Statutory, Payroll & Workflow Security Suites
- `tests/payroll-security.test.js`: 4/4 passed (Tenant leakage, privilege escalation, role authorization, org context).
- `tests/statutory-coverage.test.js`: 7/7 passed (Zero salary, negative input, EPF/ESI ceilings, leap year, precision, employer/employee separation).
- `tests/workflow-security.test.js`: 5/5 passed (Unauthorized approval, cross-tenant IDOR, self-approval policy, audit logging).

### 4. Code Health & Linter
- Biome check on `apps/app/src/app/[locale]/(admin)/admin/reports`: **0 errors**.
- Biome check on `packages/backend/convex/reports.ts`: **0 errors**.
- Reference visual capture: `docs/indiapay-reports-gallery-1920x1080.png` captured at 1920×1080 resolution.
