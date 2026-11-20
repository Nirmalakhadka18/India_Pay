# IndiaPay Reports Gallery — Test Results & Verification Report

**Date**: November 20, 2026  
**Test Harness**: Node.js Automated Verification Harness (`tests/reports-gallery-comprehensive.test.js` & `tests/reports-analytics.test.js`)  
**Deployment**: `dev:basic-bobcat-92`

---

## 1. Automated Test Suite Execution Summary

- **Suites Executed**:
  1. `tests/reports-gallery-comprehensive.test.js` (Verifies all 192 report registry items, category mappings, parameter schemas, supported formats, and statutory flags).
  2. `tests/reports-analytics.test.js` (Verifies report data queries, tenant isolation, favorite toggles, and recent report audit recording).
  3. Full platform regression audit (`scripts/run-test-audit.js` across 25 suites).
- **Outcome**: **100% Passed (0 Failures)**.

---

## 2. Specific Verification Checks

| Check # | Scope | Assertion | Status |
|:---|:---|:---|:---:|
| 1 | Reference Inventory Parity | All 192 reports in `docs/GREYTHR-COMPLETE-REFERENCE-INVENTORY.json` map 1:1 to `REPORTS_REGISTRY` in `reports-registry.ts`. | **PASS** |
| 2 | Category Structure | All 27 greytHR report categories are represented without omission or duplication. | **PASS** |
| 3 | Tenant Data Isolation | Queries to `generateReportData`, `listUserFavorites`, and `listRecentReports` strictly scope by authenticated `workspaceId`. | **PASS** |
| 4 | RBAC & Sensitive Masking | Sensitive fields (Bank Account, PAN, IFSC) are masked with `••••` unless the executing member holds `admin` role. | **PASS** |
| 5 | Favorites Persistence | Mutations to `toggleFavorite` add and remove records idempotently in `reportFavorites`. | **PASS** |
| 6 | Execution Audit Logging | Executing a report records metadata (report ID, parameter string, format, row count, timestamp) in `reportRuns`. | **PASS** |
| 7 | Query Builder Security | Only server-allowlisted fields from `QUERY_BUILDER_SOURCES` can be queried; sensitive columns require admin authorization. | **PASS** |
| 8 | Integer Paisa Integrity | Salary calculations compute with exact integer rounding without floating-point inaccuracies. | **PASS** |

---

## 3. Platform Test Audit Log Confirmation

```
Running test audit across all 25 suites...

[PASS] account-settings-audit.test.js (605ms)
[PASS] account-settings.test.js (726ms)
[PASS] batch-p0-security.test.js (606ms)
[PASS] engage-module.test.js (611ms)
[PASS] global-app-launcher.test.js (569ms)
[PASS] loan-management-p1.1.test.js (604ms)
[PASS] my-profile.test.js (611ms)
[PASS] payroll-loan-integration-p23.2.test.js (603ms)
[PASS] payroll-security.test.js (616ms)
[PASS] reimbursements-p1.2.test.js (588ms)
[PASS] reports-analytics.test.js (586ms)
[PASS] reports-gallery-audit.test.js (594ms)
[PASS] reports-gallery-comprehensive.test.js (607ms)
[PASS] settings-dropdown.test.js (598ms)
[PASS] statutory-coverage.test.js (624ms)
[PASS] statutory-units.test.js (597ms)
[PASS] system-settings-coverage.test.js (590ms)
[PASS] system-settings-employee-comprehensive.test.js (608ms)
[PASS] system-settings-general-employee.test.js (610ms)
[PASS] system-settings.test.js (583ms)
[PASS] unite-marketplace.test.js (600ms)
[PASS] user-administration-audit.test.js (579ms)
[PASS] user-administration.test.js (591ms)
[PASS] workflow-modules-comprehensive.test.js (607ms)
[PASS] workflow-security.test.js (606ms)

=======================================
Total Suites: 25 | Passed: 25 | Failed: 0 (100% Green)
```
