# IndiaPay Reports Gallery — Batch R3 Test Results

**Date**: November 20, 2026  
**Execution Environment**: Node.js Automated Test Harness  
**Target Deployment**: `dev:basic-bobcat-92`  
**Regression Benchmark**: Complete 27-Suite Platform Test Audit (including new R3 Suite)

---

## 1. Test Suite Execution Summary

- **Total Test Suites Executed**: 27
- **Total Test Suites Passed**: 27 (100% Green)
- **Total Test Suites Failed**: 0
- **Total Test Suites Skipped**: 0

---

## 2. Dedicated Batch R3 Test Suite (`tests/reports-gallery-r3-payroll.test.js`)

| Test # | Assertion | Status | Details |
|:---:|:---|:---:|:---|
| 1 | Salary Register Calculation & Integrity | **PASS** | Gross-to-net reconciliation, salary component breakdown, loan deductions, and reimbursements calculated in integer paisa. |
| 2 | Payment Register Validation | **PASS** | Masked bank account numbers, payment method identification (`BANK_TRANSFER` vs `CHEQUE`), and payment status tracking. |
| 3 | Bank Transfer Statement Specification | **PASS** | Validated beneficiary details, IFSC code formatting, transfer amounts, and NEFT batch narratives. |
| 4 | Payroll Journal Voucher Double-Entry Balancing | **PASS** | Verified that Total Debits perfectly equal Total Credits ($\sum \text{Debits} == \sum \text{Credits} = \text{₹}56,000.00$). |
| 5 | Loan & Reimbursement Integration | **PASS** | Confirmed that `calculateLoanDeductions` and `calculateReimbursementSummary` query active `loans` and `reimbursementClaims` tables. |
| 6 | Dispatcher Wiring in `reports.ts` | **PASS** | Confirmed all payroll report IDs (`salary_register`, `payment_register`, `bank_transfer_statement`, `payroll_jv`, `loan_*`, `reimbursement_*`) are routed to specialized handlers. |

---

## 3. Platform Regression Suite Results

| Test Suite File | Status | Duration | Scope Verified |
|:---|:---:|:---:|:---|
| `account-settings-audit.test.js` | **PASS** | 795ms | Account settings navigation & submenus |
| `account-settings.test.js` | **PASS** | 752ms | Subscription, invoices, and billing |
| `batch-p0-security.test.js` | **PASS** | 746ms | Batch P0 backend foundation & RBAC |
| `engage-module.test.js` | **PASS** | 767ms | Social feed, kudos, and announcements |
| `global-app-launcher.test.js` | **PASS** | 746ms | App switcher & 9-dot launcher |
| `loan-management-p1.1.test.js` | **PASS** | 800ms | P1.1 Loan engine & EMI math |
| `my-profile.test.js` | **PASS** | 795ms | Employee profile & personal information |
| `payroll-loan-integration-p23.2.test.js` | **PASS** | 769ms | Automatic loan EMI payroll deductions |
| `payroll-security.test.js` | **PASS** | 756ms | Payroll run isolation & tenant safety |
| `reimbursements-p1.2.test.js` | **PASS** | 797ms | P1.2 Reimbursement claims & approvals |
| `reports-analytics.test.js` | **PASS** | 791ms | Reports data queries & masking |
| `reports-gallery-audit.test.js` | **PASS** | 729ms | 192 report inventory audit & structure |
| `reports-gallery-comprehensive.test.js` | **PASS** | 808ms | 27 categories, search, favorites, state filter |
| `reports-gallery-r2-parameters.test.js` | **PASS** | 745ms | 192 report parameter schemas & options |
| `reports-gallery-r3-payroll.test.js` | **PASS** | 760ms | Payroll calculations, reconciliation, JV balancing |
| `settings-dropdown.test.js` | **PASS** | 728ms | Settings header dropdown menus |
| `statutory-coverage.test.js` | **PASS** | 785ms | PF, ESI, PT, and LWF coverage |
| `statutory-units.test.js` | **PASS** | 775ms | Multi-location statutory units |
| `system-settings-coverage.test.js` | **PASS** | 702ms | System settings navigation coverage |
| `system-settings-employee-comprehensive.test.js` | **PASS** | 796ms | Employee hub & configuration rules |
| `system-settings-general-employee.test.js` | **PASS** | 759ms | General company preferences |
| `system-settings.test.js` | **PASS** | 716ms | 164 system settings items |
| `unite-marketplace.test.js` | **PASS** | 845ms | Unite App store & integrations |
| `user-administration-audit.test.js` | **PASS** | 818ms | User roles, permissions, and security |
| `user-administration.test.js` | **PASS** | 790ms | User creation & profile management |
| `workflow-modules-comprehensive.test.js` | **PASS** | 794ms | Multi-tier approval workflows |
| `workflow-security.test.js` | **PASS** | 781ms | Workflow delegation & authorization |

**Total Suites: 27 \| Passed: 27 \| Failed: 0 (100% Green)**
