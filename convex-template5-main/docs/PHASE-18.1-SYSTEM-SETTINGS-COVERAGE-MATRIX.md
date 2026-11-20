# PHASE 18.1 / 18.2 — COMPLETE SYSTEM SETTINGS COVERAGE MATRIX

**Project:** IndiaPay HRMS  
**Reference:** Authenticated Victor Chasex greytHR application  
**Inventory Source:** Angular State Machine (`docs/greythr-settings-reconciled-164.json`)  
**Audit Date:** 2026-11-19 (Updated Phase 18.2)

---

## 1. Summary by Category

| Category | Total Submenus | VERIFIED | PARTIAL | UI ONLY | MISSING | DEFERRED |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **General** | 32 | 6 | 0 | 0 | 24 | 2 |
| **Employee** | 9 | 3 | 0 | 0 | 6 | 0 |
| **Payroll** | 28 | 1 | 0 | 0 | 27 | 0 |
| **Income Tax** | 11 | 1 | 0 | 0 | 10 | 0 |
| **Leave** | 20 | 1 | 0 | 0 | 19 | 0 |
| **Integrations** | 2 | 1 | 0 | 0 | 1 | 0 |
| **More** | 62 | 0 | 0 | 0 | 62 | 0 |
| Total | 164 | **13** | **0** | **0** | **149** | **2** |

---

## 2. Verified Submenus Inventory (13 / 164)

| Category | Reference Title | Angular State | Reference URL | IndiaPay Route | Status | Verified In |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| General | Company Settings | `settings.general.company-info` | `/ngapp/settings/general/company-info` | `/admin/system-settings/general/company-info` | **VERIFIED** | Phase 18 |
| General | General Options | `settings.general.general-preferences` | `/ngapp/settings/general/general-preferences` | `/admin/system-settings/general/preferences` | **VERIFIED** | Phase 18 |
| General | List of Values | `settings.general.lov` | `/ngapp/settings/general/lov` | `/admin/system-settings/general/lov` | **VERIFIED** | Phase 18.2 |
| General | Bank Branch | `settings.general.bank-branch` | `/ngapp/settings/general/bank-branch` | `/admin/system-settings/general/bank-branch` | **VERIFIED** | Phase 18.2 |
| General | Company Bank Details | `settings.general.company-bank` | `/ngapp/settings/general/company-bank` | `/admin/system-settings/general/company-bank` | **VERIFIED** | Phase 18.2 |
| General | States | `settings.general.state` | `/ngapp/settings/general/state` | `/admin/system-settings/general/state` | **VERIFIED** | Phase 18.2 |
| Employee | Employee Options | `settings.employee.employee-preferences` | `/ngapp/settings/employee/employee-preferences` | `/admin/system-settings/employee/preferences` | **VERIFIED** | Phase 18 |
| Employee | Employee No Series | `settings.employee.emp-no-series` | `/ngapp/settings/employee/emp-no-series` | `/admin/system-settings/employee/emp-no-series` | **VERIFIED** | Phase 18.2 |
| Employee | Category Group | `settings.employee.transitiongroup` | `/ngapp/settings/employee/transition-group` | `/admin/system-settings/employee/transitiongroup` | **VERIFIED** | Phase 18.2 |
| Payroll | Payroll Preferences | `settings.payroll.payroll-preferences` | `/ngapp/settings/payroll/payroll-preferences` | `/admin/system-settings/payroll/preferences` | **VERIFIED** | Phase 18 |
| Income Tax | Income Tax Preferences | `settings.income-tax.incometax-preferences` | `/ngapp/settings/income-tax/incometax-preferences` | `/admin/system-settings/income-tax/preferences` | **VERIFIED** | Phase 18 |
| Leave | Leave Options | `settings.leave.leaveOptions.leavepreferences` | `/ngapp/settings/leave/leavepreferences` | `/admin/system-settings/leave/preferences` | **VERIFIED** | Phase 18 |
| Integrations | Miscellaneous | `settings.integrations` | `/ngapp/settings/integrations` | `/admin/system-settings/integrations` | **VERIFIED** | Phase 18 |

---

## 3. Deferred Submenus (2 / 164)

| Category | Reference Title | Angular State | Reason for Deferral |
| :--- | :--- | :--- | :--- |
| General | NGA PEX Settings | `settings.general.ngapex-preferences` | Regional Middle-East third-party integration connector. |
| General | WPS Options | `settings.general.wps-preferences` | United Arab Emirates Wages Protection System statutory compliance. |

---

## 4. Remaining Submenus by Priority (149 / 164)

- **Phase 18.3 (Payroll - 27 Submenus):** Statutory PF/ESI/PT rules, FBP Policy setup, Pay Item master, Salary components.
- **Phase 18.4 (Income Tax - 10 Submenus):** Tax Slabs, Form 16 Options, Form 24Q, IT Section 80C/80D limits, Form 12BA mapping.
- **Phase 18.5 (Leave - 19 Submenus):** Leave policies (1–9), Leave schemes, Weekend policies, Year lock settings, Settlement rules.
- **Phase 18.6 (More - 62 Submenus):** Attendance policy, Claims group custom fields, Helpdesk categories, Event notifications.
- **Phase 18.7 (General & Employee Extensions - 31 Submenus):** Multi-company info, Currency mapping, Asset group settings, Directory config.
