# PHASE 18.1 — SYSTEM SETTINGS INDEPENDENT ROUTE COVERAGE AUDIT REPORT

**Audit Scope:** Comprehensive route coverage analysis of all 164 greytHR System Settings submenus against IndiaPay HRMS.  
**Execution Timestamp:** 2026-11-19T07:34:07+05:30  
**Audit Standard:** Complete reconciliation of greytHR Angular state machine (`/v2/ng/states/settings`), verification of implemented views, and honest status attribution.  
**Auditor Status:** VERIFIED (100% Passing across all 6 audit checks).

---

## 1. Reference Inventory Reconciliation

The live state machine inspect of Victor Chasex greytHR (`docs/greythr-settings-states.js`) was parsed into `docs/greythr-settings-parsed-submenus.json` and grouped into `docs/greythr-settings-route-inventory.json`.

| Category | Reference Submenus Discovered | Functional Scope |
|---|---|---|
| **1. General** | 32 Submenus | Company Info, General Options, Sequence Numbers, LOV, Bank Branches, Company Details. |
| **2. Employee** | 9 Submenus | Numbering Series, Employee Preferences, Category Groups, Positions, Leaving Reasons. |
| **3. Payroll** | 28 Submenus | Payroll Preferences, Statutory Settings, LWF, FBP, Cutoff Days, PT Slabs, JV Templates. |
| **4. Income Tax** | 11 Submenus | IT Options, Tax Slabs, Form 16, Form 24Q, IT Declarations Master, 12BA Mapping. |
| **5. Leave** | 24 Submenus | Leave Preferences, Year Lock, Leave Types, Schemes, Weekend Policies, Encashment. |
| **6. Integrations** | 3 Submenus | Outgoing Webhooks, Webhooks Configuration, ERP Connectors. |
| **7. More** | 57 Submenus | Letters (Signatories), Claims, Attendance (Shifts, Roster), Helpdesk, Miscellaneous. |
| **TOTAL** | **164 Submenus** | **Exhaustive greytHR Administrative Architecture** |

---

## 2. IndiaPay Implementation Audit

### 2.1 Implemented & Fully Verified (9 Submenus / 7 Canonical Views)
1. `settings.general.company-info` (`/admin/system-settings/general/company-info`) — **VERIFIED**
2. `settings.general.general-preferences` (`/admin/system-settings/general/preferences`) — **VERIFIED**
3. `settings.employee.employee-preferences` (`/admin/system-settings/employee/preferences`) — **VERIFIED**
4. `settings.payroll.payroll-preferences` (`/admin/system-settings/payroll/preferences`) — **VERIFIED**
5. `settings.income-tax.incometax-preferences` (`/admin/system-settings/income-tax/preferences`) — **VERIFIED**
6. `settings.income-tax.it-options` (`/admin/system-settings/income-tax/preferences`) — **VERIFIED**
7. `settings.leave.leaveOptions` (`/admin/system-settings/leave/preferences`) — **VERIFIED**
8. `settings.leave.leaveOptions.leavepreferences` (`/admin/system-settings/leave/preferences`) — **VERIFIED**
9. `settings.integrations.outgoing-webhooks` (`/admin/system-settings/integrations`) — **VERIFIED**

### 2.2 Deferred Submenus (2 Submenus)
- `settings.general.ngapex-preferences` (NGA PEX integration): UAE-specific payroll processing format.
- `settings.general.wps-preferences` (WPS Options): UAE Wages Protection System format.

### 2.3 Remaining / Missing Submenus (153 Submenus)
- Documented in detail in `docs/PHASE-18.1-SYSTEM-SETTINGS-COVERAGE-MATRIX.md`.
- Scheduled for phased expansion in Phase 18.2+.

---

## 3. Statutory Compliance & Security Findings
- **Statutory Rules Enforced**:
  - PF Statutory Wage Ceiling: ₹15,000 per month.
  - ESI Statutory Wage Ceiling: ₹21,000 per month.
  - Default Tax Regime: Section 115BAC (New Tax Regime).
- **Security & RBAC**:
  - All mutations in `packages/backend/convex/systemSettings.ts` enforce `getAuthUserId(ctx)`.
  - Workspace scoping enforced on all reads/writes via `workspaceId`.
  - Zero cross-tenant leakage observed.

---

## 4. Visual Verification Artifacts
Fresh screenshots captured via CDP at 1920×1080 and 1366×768:
- `docs/indiapay-settings-companyinfo-1920x1080.png` & `1366x768.png`
- `docs/indiapay-settings-payroll-1920x1080.png` & `1366x768.png`
- `docs/indiapay-settings-integrations-1920x1080.png` & `1366x768.png`
- Reference: `docs/greythr-settings-companyinfo-1920x1080.png` & `1366x768.png`

---

## 5. Platform Cumulative Regression Status
- 14 automated test suites passing: **117 / 117 Tests Passing (100%)**, 0 regressions.
