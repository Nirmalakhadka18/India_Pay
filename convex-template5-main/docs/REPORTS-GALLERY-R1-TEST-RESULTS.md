# IndiaPay Reports Gallery — Batch R1 Test Results

**Date**: November 20, 2026  
**Execution Environment**: Node.js Automated Test Harness  
**Target Deployment**: `dev:basic-bobcat-92`  
**Regression Benchmark**: Complete 25-Suite Platform Test Audit

---

## 1. Test Suite Execution Summary

- **Total Test Suites Executed**: 25
- **Total Test Suites Passed**: 25 (100% Green)
- **Total Test Suites Failed**: 0
- **Total Test Suites Skipped**: 0

---

## 2. Platform Regression Suite Results

| Test Suite File | Status | Duration | Scope Verified |
|:---|:---:|:---:|:---|
| `account-settings-audit.test.js` | **PASS** | 952ms | Account settings navigation & submenus |
| `account-settings.test.js` | **PASS** | 837ms | Subscription, invoices, and billing |
| `batch-p0-security.test.js` | **PASS** | 801ms | Batch P0 backend foundation & RBAC |
| `engage-module.test.js` | **PASS** | 879ms | Social feed, kudos, and announcements |
| `global-app-launcher.test.js` | **PASS** | 764ms | App switcher & 9-dot launcher |
| `loan-management-p1.1.test.js` | **PASS** | 774ms | P1.1 Loan engine & EMI math |
| `my-profile.test.js` | **PASS** | 804ms | Employee profile & personal information |
| `payroll-loan-integration-p23.2.test.js` | **PASS** | 858ms | Automatic loan EMI payroll deductions |
| `payroll-security.test.js` | **PASS** | 904ms | Payroll run isolation & tenant safety |
| `reimbursements-p1.2.test.js` | **PASS** | 936ms | P1.2 Reimbursement claims & approvals |
| `reports-analytics.test.js` | **PASS** | 919ms | Reports data queries & masking |
| `reports-gallery-audit.test.js` | **PASS** | 977ms | 192 report inventory audit & structure |
| `reports-gallery-comprehensive.test.js` | **PASS** | 853ms | 27 categories, search, favorites, state filter |
| `settings-dropdown.test.js` | **PASS** | 936ms | Settings header dropdown menus |
| `statutory-coverage.test.js` | **PASS** | 1040ms | PF, ESI, PT, and LWF coverage |
| `statutory-units.test.js` | **PASS** | 898ms | Multi-location statutory units |
| `system-settings-coverage.test.js` | **PASS** | 938ms | System settings navigation coverage |
| `system-settings-employee-comprehensive.test.js` | **PASS** | 891ms | Employee hub & configuration rules |
| `system-settings-general-employee.test.js` | **PASS** | 881ms | General company preferences |
| `system-settings.test.js` | **PASS** | 1029ms | 164 system settings items |
| `unite-marketplace.test.js` | **PASS** | 1014ms | Unite App store & integrations |
| `user-administration-audit.test.js` | **PASS** | 874ms | User roles, permissions, and security |
| `user-administration.test.js` | **PASS** | 897ms | User creation & profile management |
| `workflow-modules-comprehensive.test.js` | **PASS** | 850ms | Multi-tier approval workflows |
| `workflow-security.test.js` | **PASS** | 1056ms | Workflow delegation & authorization |

---

## 3. Reports Gallery Specific Assertions Verified

1. **Category Completeness**: 27/27 categories verified.
2. **Report Inventory**: 192/192 report definitions verified with 0 placeholders.
3. **Primary Route**: `/reports` renders the Reports Gallery directly without promotional deflections.
4. **Sub-Hub Coexistence**: `/reports/payroll-history`, `/admin/reports/recent`, `/admin/reports/querybuilder`, and `/admin/reports/analytics` operate seamlessly.
5. **Persistence**: Toggling a favorite persists to `reportFavorites` and updates the favorites count.
6. **Execution Audit**: Generating/exporting a report logs metadata in `reportRuns`.
7. **RBAC & Sensitive Masking**: Non-admin users cannot access raw PAN, bank account numbers, or salary breakdown fields.
