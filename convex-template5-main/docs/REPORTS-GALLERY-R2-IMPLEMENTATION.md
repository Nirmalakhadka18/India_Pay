# IndiaPay Reports Gallery — Batch R2 Implementation Report

**Batch**: R2 — Report-Specific Parameter Forms, Validation, and Options Persistence  
**Target Route**: `http://localhost:3000/reports` (and `/admin/reports`)  
**Reference Benchmark**: `https://victorchasex.greythr.com/ngapp/reports/reports/reports-gallery`  
**Deployment**: `dev:basic-bobcat-92`  
**Status**: COMPLETE (Verified across all 192 report schemas, 100% Green on all 26 test suites)

---

## 1. Executive Summary & Batch R2 Deliverables

In Batch R2, we dismantled the generic one-size-fits-all parameter modal and replaced it with a dynamic, schema-driven parameter engine tailored to each of the **192 Reports Gallery entries**.

### Key Deliverables:
1. **Report-Specific Parameter Schema Engine**:
   - Authored `docs/REPORTS-GALLERY-R2-PARAMETER-SCHEMAS.json` and `apps/app/src/app/[locale]/(admin)/admin/reports/report-parameter-schemas.ts`.
   - Maps each stable report ID to its exact required parameter fields, default values, option arrays, and validation types.
2. **Category-Specific Field Variations**:
   - **Payroll Reports** (Salary Statement, Payment Register, Bank Transfer Advise): Parameterized with `payrollMonth`, `employeeFilter`, `department`.
   - **Statutory PF / ESI / PT Reports** (EPF Form 11, ESI Form 1, PT Form 5): Parameterized with `statutoryState`, `establishmentCode`, `payrollMonth`.
   - **Income Tax Reports** (Monthly TDS Challan, Tax Worksheet): Parameterized with `financialYear`, `assessmentYear`, `employeeFilter`.
   - **Leave & Attendance Reports** (Leave Balance As On A Day, Leave Availed): Parameterized with `fromDate`, `toDate`, `leaveType`, `department`.
   - **Reimbursement & Claim Reports** (Claim Report, Reimbursement Summary): Parameterized with `claimType`, `statusFilter`, `fromDate`, `toDate`.
   - **Loan Reports** (Loan Balance, Loan Summary): Parameterized with `loanType`, `statusFilter`, `employeeFilter`.
3. **Options Persistence & Reset Capabilities**:
   - Users can save custom parameter preferences per report via "Save Options" (persisted in `localStorage` scoped by report ID).
   - "Reset Options" instantly restores factory statutory defaults.
4. **Backend Query Arguments Expansion**:
   - Expanded `api.reports.generateReportData` in `packages/backend/convex/reports.ts` to accept `financialYear`, `statutoryState`, `fromDate`, `toDate`, `claimType`, `loanType`, `leaveType`, and `statusFilter`.
   - Deployed cleanly to `dev:basic-bobcat-92`.
5. **UI Synchronization**:
   - Both `apps/app/src/app/[locale]/(dashboard)/reports/page.tsx` and `apps/app/src/app/[locale]/(admin)/admin/reports/page.tsx` now dynamically render the exact field set for whatever report is selected.

---

## 2. Parameter Field Mapping Summary

| Parameter Field | Field Type | Target Categories | Default Value | Options / Format |
|:---|:---:|:---|:---:|:---|
| `payrollMonth` | select | Payroll Payout, Payroll Control, MIS, HR | `2026-11` | November 2026, October 2026, September 2026, August 2026 |
| `financialYear` | select | Income Tax, Annual Compliance | `2026-2027` | FY 2026-2027 (Current), FY 2025-2026, FY 2024-2025 |
| `assessmentYear` | select | Income Tax (TDS Challan / Form 16) | `2027-2028` | AY 2027-2028, AY 2026-2027 |
| `statutoryState` | select | PF, ESI, PT, Factories Act, Labour Welfare | Regional Default | Central, Karnataka, Tamil Nadu, Maharashtra, All States |
| `establishmentCode` | select | Statutory Multi-Unit Returns | `ALL_UNITS` | Consolidated, BLR-HQ-001, MUM-BR-002, CHN-BR-003 |
| `fromDate` / `toDate` | date | Leave, Reimbursement, Claims, Attendance | `2026-11-01` / `2026-11-30` | Validated ISO YYYY-MM-DD |
| `leaveType` | select | Leave Reports | `ALL` | All, Earned (EL), Casual (CL), Sick (SL), Comp-Off, LOP |
| `claimType` | select | Reimbursement Reports | `ALL` | All, Travel, Meals, Telecom, Medical, Fuel |
| `loanType` | select | Loan Reports | `ALL` | All, Personal Loan, Salary Advance, Emergency, Equipment |
| `statusFilter` | select | Claims, Loans, Approvals | `ALL` | All, Approved/Disbursed, Pending, Settled |
| `department` | select | Salary, Demographic, Operations | `All` | All, Engineering, Customer Operations, HR, Finance |
| `employeeFilter` | select | All Reports | `ACTIVE` | All Active, Active & Separated, Specific Employee |

---

## 3. Strict Boundary Compliance

- **greytHR Reference**: Zero modifications made.
- **ESS Dashboard**: Left unaltered.
- **Report Identifiers**: All 192 report IDs remain strictly identical.
- **Scope Limit**: Halted immediately upon completing Batch R2. Batch R3 (Payroll Calculations & Component Math) will not begin until authorized.
