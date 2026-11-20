# IndiaPay Reports Gallery — Implementation Status & Gap Analysis

**Date**: November 20, 2026  
**Reference Target**: greytHR Authenticated Reports Gallery (`https://victorchasex.greythr.com/ngapp/reports/reports/reports-gallery`)  
**Total Reports Catalogued**: 192 Reports across 27 Categories + 5 Hub Modules

---

## 1. Summary of Current State vs. Target Parity

| Layer / Feature | Current IndiaPay Implementation | Reference greytHR Target | Classification |
|:---|:---|:---|:---:|
| **Navigation & Layout** | Category accordion, search bar, state selector, tabs (`All` vs `Favorites`), top subnav. | Category sidebar/accordion, favorites toggle, global search, breadcrumbs, action bar. | **VERIFIED** |
| **Reports Catalog Count** | 192 individual report definitions declared in `reports-registry.ts`. | 192 reference reports catalogued in REA shadow DOM. | **VERIFIED** |
| **Category Structure** | 27 distinct categories matching greytHR taxonomy. | 27 distinct categories. | **VERIFIED** |
| **Favorites Management** | Persistent per-user favorites backed by `reportFavorites` table. | Instant star toggle, favorites filtering tab. | **VERIFIED** |
| **Recent Reports Audit** | Stored in `reportRuns` table, visible at `/admin/reports/recent`. | Execution history with status, format, parameter storage. | **VERIFIED** |
| **Custom Query Builder** | UI with source selection, field picker, filters at `/admin/reports/querybuilder`. | Custom reporting engine with output fields & sorting. | **VERIFIED** |
| **Parameter Forms** | Generic modal providing Month, Department, Employee, and Format selectors. | **Report-specific parameter forms** (date ranges, component selection, statutory states). | **PARTIAL** |
| **Calculation Handlers** | Generic dispatcher in `generateReportData` (`salaries`, `pf/esi/pt`, `leaves`, `demographic`). | **Dedicated calculation engines** per report category with exact statutory formulas. | **PARTIAL** |
| **Export Engines** | Client-side CSV and print/PDF generation. | Formatted XLSX, PDF layouts with official statutory form headers, CSV. | **PARTIAL** |
| **Statutory Form Layouts** | Tabular generic preview with statutory draft disclaimer banner. | Exact government format emulation (Form 5, Form 11, Form A/B/C/D). | **PARTIAL** |

---

## 2. Classification Breakdown

- **Total Reports**: 192
- **VERIFIED (End-to-End Accurate Calculation & Full Workflow)**: 8 Reports (Core Salary Register, Bank Transfer Statement, Bank Transfer Advise, Payment Register, Basic PF Monthly Return, Basic ESI Return, Leave Balance, Employee Directory).
- **PARTIAL (UI Available, Parametric Modal, Basic Dynamic Calculation, Needs Specific Form Fields/Layout)**: 184 Reports.
- **MISSING (Unregistered or Inaccessible)**: 0 Reports (All 192 are catalogued and reachable).

---

## 3. Engineering Implementation Roadmap (Batches R1–R8)

1. **Batch R1: Reports Gallery UI & Navigation Polish**
   - Align `/reports` and `/admin/reports` to ensure identical styling, exact shadow DOM spacing, responsive table cards, and favorites synchronization.
2. **Batch R2: Report-Specific Parameter Schema**
   - Replace one-size-fits-all parameter controls with dynamic form schemas:
     - Date Range (From Date / To Date) for attendance and attrition reports.
     - Financial Year selection for tax and bonus reports.
     - Statutory State / Branch selection for PT and Labour Welfare Fund reports.
3. **Batch R3: Payroll & Compensation Engine Handlers**
   - Bind calculation directly to historical `payrollRuns` and `payrollItems` for exact historical salary revisions, LOP reversals, and arrears.
4. **Batch R4: Workforce, Leave, and Attendance Handlers**
   - Aggregate actual daily punch records from `attendance` and leave balance accruals.
5. **Batch R5: Statutory Compliance Form Handlers**
   - Implement exact form structures for PF (Forms 11, 2, 5, 10, 12A), ESI (Forms 1, 5, 11), PT (Karnataka Forms 5/5A), and Central Ease of Compliance (Forms A, B, C, D).
6. **Batch R6: Financial Reports (Loans, Reimbursements, F&F)**
   - Connect reports directly to newly implemented P1.1 `loans` and P1.2 `reimbursementClaims` tables.
7. **Batch R7: Query Builder & Run Again Workflow**
   - Support one-click "Run Again" from `/admin/reports/recent`, repopulating exact prior filters and execution contexts.
8. **Batch R8: Formatted Multi-Format Exports & Security Evals**
   - Comprehensive XLSX styling and automated end-to-end tests across all 192 report keys.
