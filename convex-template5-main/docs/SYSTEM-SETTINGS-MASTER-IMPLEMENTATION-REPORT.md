# INDIA PAY HRMS — COMPLETE SYSTEM SETTINGS MASTER IMPLEMENTATION REPORT
## A–Z greytHR Parity & Execution Roadmap

**Project:** IndiaPay HRMS  
**Reference Application:** Authenticated greytHR (Victor Chasex tenant: `https://victorchasex.greythr.com/ngapp/settings/general/company-info`)  
**Audit & Implementation Date:** 2026-11-19  
**Total Canonical Inventory:** 164 Submenus  
**Current Implementation Status:** 13 VERIFIED | 2 DEFERRED | 149 MISSING

---

## 1. Canonical 164-Item Inventory Reconciliation

To establish complete clarity and eliminate previous count drift, the inventory was reconciled directly against the authenticated greytHR Angular state definitions. The 164 items map across the 7 top-level navigation families as follows:

| # | Navigation Category | Total Submenus | Implemented & Verified | Deferred (Regional) | Remaining to Implement |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | **General** | **32** | 6 | 2 (UAE WPS / NGA) | 24 |
| 2 | **Employee** | **9** | 3 | 0 | 6 |
| 3 | **Payroll** | **28** | 1 | 0 | 27 |
| 4 | **Income Tax** | **11** | 1 | 0 | 10 |
| 5 | **Leave** | **24** | 1 | 0 | 23 |
| 6 | **Integrations** | **3** | 1 | 0 | 2 |
| 7 | **More** (Helpdesk, Claims, Attendance, Letters, Misc) | **57** | 0 | 0 | 57 |
| **Total** | **All Categories** | **164** | **13 (7.9%)** | **2 (1.2%)** | **149 (90.9%)** |

### Reconciliation Explanation:
- In the initial inspection, **Leave** contained 24 states and **Integrations** contained 3 states (total 164).
- A secondary group attempted to collapse 4 Leave states (`settings.leave.scheme`, `settings.leave.mail`, `settings.leave.reason`, `settings.leave.addreason`) and 1 Webhooks state into **More** (creating a 20 / 2 / 62 split).
- **Canonical Decision:** The inventory preserves the **exact state structure** of the reference application (`docs/greythr-canonical-164-inventory.json`). Every entry retains its immutable Angular state name and route URL without artificial reassignment.

---

## 2. Status of Currently Implemented Submenus (13 Verified)

All 13 completed submenus have dedicated canonical routes, functional UI matching greytHR, working Convex backend schemas/mutations, server-side RBAC, and screenshot evidence at 1920×1080 and 1366×768:

1. **General → Company Settings (`settings.general.company-info`)** → `/admin/system-settings/general/company-info`
2. **General → General Options (`settings.general.general-preferences`)** → `/admin/system-settings/general/preferences`
3. **General → List of Values (`settings.general.lov`)** → `/admin/system-settings/general/lov`
4. **General → Bank Branch (`settings.general.bank-branch`)** → `/admin/system-settings/general/bank-branch`
5. **General → Company Bank Details (`settings.general.company-bank`)** → `/admin/system-settings/general/company-bank`
6. **General → States (`settings.general.state`)** → `/admin/system-settings/general/state`
7. **Employee → Employee Options (`settings.employee.employee-preferences`)** → `/admin/system-settings/employee/preferences`
8. **Employee → Employee No Series (`settings.employee.emp-no-series`)** → `/admin/system-settings/employee/emp-no-series`
9. **Employee → Category Group (`settings.employee.transitiongroup`)** → `/admin/system-settings/employee/transitiongroup`
10. **Payroll → Payroll Preferences (`settings.payroll.payroll-preferences`)** → `/admin/system-settings/payroll/preferences`
11. **Income Tax → Income Tax Preferences (`settings.income-tax.incometax-preferences`)** → `/admin/system-settings/income-tax/preferences`
12. **Leave → Leave Options (`settings.leave.leaveOptions.leavepreferences`)** → `/admin/system-settings/leave/preferences`
13. **Integrations → Miscellaneous Connectors (`settings.integrations`)** → `/admin/system-settings/integrations`

---

## 3. Master Phased Implementation Roadmap (A to Z)

To systematically implement the remaining 149 submenus with true functional fidelity and zero regression:

```
[Phase 18.2] Completed: General & Employee Masters (6 Pages)
      │
      ▼
[Phase 18.3] Employee Settings Completion (6 Remaining Submenus)
      │  ├─ Employee Onboarding / Transition
      │  ├─ Employee Position (Designation, Department, Grade, Division)
      │  ├─ Leaving Reasons (Resignation, Termination, Superannuation)
      │  ├─ Asset Group Settings (IT, Facilities, Mobile assets)
      │  ├─ Employee Directory Config (Searchable fields, Privacy toggles)
      │  └─ Edit Employee No Series (/emp-no-series/:id)
      │
      ▼
[Phase 18.4] Payroll Settings Completion (27 Remaining Submenus)
      │  ├─ Statutory Filing Locations (PF, PT, ESI & LWF)
      │  ├─ Profession Tax Locations & Slab Structures
      │  ├─ Labour Welfare Fund (LWF) Policies & State Contribution Tables
      │  ├─ Flexible Benefit Plan (FBP) Policy Setup & Components
      │  ├─ Lookup Tables Master (Custom calculation grids)
      │  ├─ Category-Based Cutoff Days (Attendance & salary cycles)
      │  ├─ Journal Voucher (JV) Templates, Groupings & Account Mapping
      │  ├─ Processing Sequences & Agent Configuration
      │  └─ Forex Currency Conversion Configuration
      │
      ▼
[Phase 18.5] Income Tax Settings Completion (10 Remaining Submenus)
      │  ├─ Tax Slabs (Old vs New Regime Section 115BAC)
      │  ├─ IT Section-Max Limit (80C, 80D, 80G, 24b cap limits)
      │  ├─ Form 16 Options & Annexure B signatory mapping
      │  ├─ Form 24Q Quarterly Return Parameters
      │  ├─ Form 12BA Perquisites Mapping
      │  ├─ Exemption Group Map (HRA, LTA, Gratuity rules)
      │  ├─ Tax Projection Map & Proof Submission Deadlines
      │  └─ IT Declaration Master (Allowable deduction codes)
      │
      ▼
[Phase 18.6] Leave Settings Completion (23 Remaining Submenus)
      │  ├─ Leave Types (Privilege Leave, Casual, Sick, Maternity, Paternity)
      │  ├─ Leave Rules & Policies (Accrual, Proration, Encashment, Carry-forward)
      │  ├─ Weekend Policy (5-day, 6-day, Alternating 2nd/4th Saturday)
      │  ├─ Leave Scheme Master (Assignment to employee grades/departments)
      │  ├─ Year-End Lock & Leave Settlement Rules
      │  └─ Leave Event Reminders & Reason Master
      │
      ▼
[Phase 18.7] Integrations Completion (2 Remaining Submenus)
      │  ├─ Outgoing Webhook Event Dispatcher
      │  └─ Add/Edit Event Notification Handler
      │
      ▼
[Phase 18.8] More: Helpdesk, Claims, Attendance, Letters & Misc (57 Submenus)
      │  ├─ Help Desk (Ticket Categories, Priority SLA, Reviewer routing) - 6 submenus
      │  ├─ Claims & Reimbursements (Claim Items, Template Mapping, Custom Fields) - 8 submenus
      │  ├─ Attendance Policies (Shift Rosters, Production Plans, Absent Marking) - 19 submenus
      │  ├─ Letter Templates & Authorized Signatory Setup - 3 submenus
      │  └─ Advanced & Miscellaneous System Options - 21 submenus
      │
      ▼
[Phase 18.9] Complete System Settings Independent Acceptance Audit
         ├─ End-to-end traversal of all 164 submenus
         ├─ Full-resolution dual-viewport verification (1080p & 768p)
         ├─ Multi-tenant IDOR attack testing & mutation security audit
         └─ Zero regression sign-off across all modules
```

---

## 4. Execution Principles for Every Submenu

1. **Inspection First:** For every submenu, inspect the authenticated Victor Chasex greytHR page via CDP to capture exact form fields, headers, tables, button labels, and validation behaviors.
2. **Dedicated Route & Page:** No placeholder redirects. Every entry must load its canonical page (`/admin/system-settings/...`).
3. **Convex Backend Persistence:** Configuration changes must persist to workspace-scoped Convex database tables, surviving page reloads.
4. **RBAC & Isolation:** Enforce `getAuthUserId(ctx)` server-side on every mutation. Reject unauthorized role access and cross-workspace access attempts.
5. **Regression Safety:** Ensure all 17 existing platform test suites (134 platform tests) remain passing throughout development. Zero modifications to ESS routes (`/` or `/my-portal`).
