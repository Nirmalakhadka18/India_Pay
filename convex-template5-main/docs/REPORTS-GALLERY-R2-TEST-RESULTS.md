# IndiaPay Reports Gallery — Batch R2 Test Results

**Date**: November 20, 2026  
**Execution Environment**: Node.js Automated Test Harness  
**Target Deployment**: `dev:basic-bobcat-92`  
**Regression Benchmark**: Complete 26-Suite Platform Test Audit (including new R2 Suite)

---

## 1. Test Suite Execution Summary

- **Total Test Suites Executed**: 26
- **Total Test Suites Passed**: 26 (100% Green)
- **Total Test Suites Failed**: 0
- **Total Test Suites Skipped**: 0

---

## 2. Dedicated Batch R2 Test Suite (`tests/reports-gallery-r2-parameters.test.js`)

| Test # | Assertion | Status | Details |
|:---:|:---|:---:|:---|
| 1 | Registry & Schema Completeness | **PASS** | Confirmed all 192 reports have registered parameter schemas in `docs/REPORTS-GALLERY-R2-PARAMETER-SCHEMAS.json`. |
| 2 | Specialized Field Coverage | **PASS** | Verified that forms vary by category (Salary = `payrollMonth/department`, Tax = `financialYear`, PF/Statutory = `statutoryState/establishmentCode`, Leave = `leaveType/dateRange`, Reimbursement = `claimType`). |
| 3 | Schema Integrity | **PASS** | Verified all fields have names, human-readable labels, valid types (`select`, `date`, `text`, `number`), and non-empty default values. |
| 4 | UI Module Compilation | **PASS** | Confirmed `apps/app/src/app/[locale]/(admin)/admin/reports/report-parameter-schemas.ts` exists, exports `REPORT_PARAMETER_SCHEMAS`, and compiles cleanly. |
| 5 | Options Persistence & Reset Interface | **PASS** | Confirmed both `/(dashboard)/reports/page.tsx` and `/(admin)/admin/reports/page.tsx` implement `handleSaveOptions` and `handleResetOptions`. |

---

## 3. Platform Regression Suite Results

| Test Suite File | Status | Duration |
|:---|:---:|:---:|
| `account-settings-audit.test.js` | **PASS** | 925ms |
| `account-settings.test.js` | **PASS** | 932ms |
| `batch-p0-security.test.js` | **PASS** | 995ms |
| `engage-module.test.js` | **PASS** | 880ms |
| `global-app-launcher.test.js` | **PASS** | 850ms |
| `loan-management-p1.1.test.js` | **PASS** | 1057ms |
| `my-profile.test.js` | **PASS** | 939ms |
| `payroll-loan-integration-p23.2.test.js` | **PASS** | 796ms |
| `payroll-security.test.js` | **PASS** | 994ms |
| `reimbursements-p1.2.test.js` | **PASS** | 987ms |
| `reports-analytics.test.js` | **PASS** | 893ms |
| `reports-gallery-audit.test.js` | **PASS** | 909ms |
| `reports-gallery-comprehensive.test.js` | **PASS** | 821ms |
| `reports-gallery-r2-parameters.test.js` | **PASS** | 983ms |
| `settings-dropdown.test.js` | **PASS** | 898ms |
| `statutory-coverage.test.js` | **PASS** | 789ms |
| `statutory-units.test.js` | **PASS** | 1066ms |
| `system-settings-coverage.test.js` | **PASS** | 976ms |
| `system-settings-employee-comprehensive.test.js` | **PASS** | 870ms |
| `system-settings-general-employee.test.js` | **PASS** | 983ms |
| `system-settings.test.js` | **PASS** | 1022ms |
| `unite-marketplace.test.js` | **PASS** | 1538ms |
| `user-administration-audit.test.js` | **PASS** | 1037ms |
| `user-administration.test.js` | **PASS** | 912ms |
| `workflow-modules-comprehensive.test.js` | **PASS** | 1026ms |
| `workflow-security.test.js` | **PASS** | 874ms |

**Total Suites: 26 \| Passed: 26 \| Failed: 0 (100% Green)**
