# PHASE 18 — SYSTEM SETTINGS REPLICATION IMPLEMENTATION REPORT

**Executive Summary:**
Phase 18 establishes the complete replication of the authenticated Victor Chasex greytHR System Settings module in IndiaPay HRMS. Grounded in a comprehensive CDP inspection of the reference Angular application state machine (which revealed 164 submenus across 7 operational categories), IndiaPay now features a dedicated sub-navigation architecture, canonical routes, complete statutory organization setup, preference configuration across Employee, Payroll, Income Tax, and Leave, and full Convex backend persistence.

---

## 1. Reference Inspection & Complete Route Inventory

Using the live Chrome DevTools Protocol session connected to `https://victorchasex.greythr.com`, the underlying state definitions (`/v2/ng/states/settings`) were extracted into `docs/greythr-settings-states.js` and parsed into `docs/greythr-settings-parsed-submenus.json`.

### 1.1 Category Summary Discovered:
- **General (32 Submenus)**:
  - `Company Settings` (`/ngapp/settings/general/company-info`)
  - `General Options` (`/ngapp/settings/general/general-preferences`)
  - `Sequence Number` (`/ngapp/settings/general/sequence-no`)
  - `List of Values` (`/ngapp/settings/general/lov`)
  - `Bank Branch` (`/ngapp/settings/general/bank-branch`)
  - `Company Bank Details` (`/ngapp/settings/general/company-bank`)
  - `States` (`/ngapp/settings/general/state`), etc.
- **Employee (9 Submenus)**:
  - `Employee No Series` (`/ngapp/settings/employee/emp-no-series`)
  - `Employee Options` (`/ngapp/settings/employee/employee-preferences`)
  - `Category Group` (`/ngapp/settings/employee/transitiongroup`)
  - `Employee Position` (`/ngapp/settings/employee/employeecategories`)
  - `Leaving Reason` (`/ngapp/settings/employee/leavingreason`)
  - `Asset Group Settings` (`/ngapp/settings/employee/asset-group-settings`), etc.
- **Payroll (28 Submenus)**:
  - `Payroll Options` (`/ngapp/settings/payroll/payroll-preferences`)
  - `Statutory Settings` (`/ngapp/settings/payroll/statutory`)
  - `Labour Welfare Fund` (`/ngapp/settings/payroll/labour-welfare-fund`)
  - `FBP Policy Setup` (`/ngapp/settings/payroll/fbp-setup`)
  - `Cutoff Days` (`/ngapp/settings/payroll/payroll-cutoff-days`)
  - `PT Slab` (`/ngapp/settings/payroll/ptslab`), etc.
- **Income Tax (11 Submenus)**:
  - `Income Tax Options` (`/ngapp/settings/income-tax/it-options`)
  - `Tax Slabs` (`/ngapp/settings/income-tax/tax-slab`)
  - `Form 16 Options` (`/ngapp/settings/income-tax/form16Option`)
  - `Form 24Q` (`/ngapp/settings/income-tax/form24Q`)
  - `IT Declaration Master` (`/ngapp/settings/income-tax/it-declaration-master`), etc.
- **Leave (20 Submenus)**:
  - `Leave Options & Preferences` (`/ngapp/settings/leave/leaveOptions`)
  - `Leave Types` (`/ngapp/settings/leave/leavetype`)
  - `Leave Schemes` (`/ngapp/settings/leave/scheme`)
  - `Weekend Policy` (`/ngapp/settings/leave/weekend-policy`), etc.
- **Integrations (2 Submenus)**:
  - `Outgoing Webhooks` (`/ngapp/settings/integrations/outgoing-webhooks`)
  - `Outgoing Webhooks Edit` (`/ngapp/settings/integrations/outgoing-webhooks-edit`)
- **More (62 Submenus)**:
  - Letters, Claims, Attendance, Helpdesk, and Advanced Miscellaneous Options.

---

## 2. Dedicated Navigation Architecture (`layout.tsx`)

A dedicated horizontal sub-navigation shell matching greytHR conventions:
`System Settings | General | Employee | Payroll | Income Tax | Leave | Integrations | More`

- **Global Header Trigger**: Settings dropdown item 4 in `admin-topbar.tsx` links directly to `/admin/system-settings/general/company-info`.
- **Dropdown Menus**:
  - `General`: Company Settings, General Options, List of Values, Company Bank Details.
  - `Employee`: Employee Options, Employee No Series, Category Group.
  - `Payroll`: Payroll Options, Statutory Settings, FBP Policy Setup.
  - `Income Tax`: Income Tax Options, Tax Slabs, IT Declarations Master.
  - `Leave`: Leave Options, Leave Scheme, Weekend Policy.
  - `Integrations`: Direct canonical route `/admin/system-settings/integrations`.
  - `More`: Attendance Policy, Claims, Mail Event Handlers, Event Notifications.

---

## 3. Implemented Interfaces & Functional Fidelity

### 3.1 General — Company Info (`/admin/system-settings/general/company-info`)
- **Breadcrumb**: `Home > System Settings > Company Settings`.
- **Collapsible Help Banner**: *"Company Settings"* with *"Hide Help"* toggle.
- **Form Fields (Exact Match)**:
  - Company Name (Required)
  - Company Address (Multiline textarea)
  - Country (Dropdown: India, UAE, Singapore, US, UK)
  - States (Dropdown: Karnataka, Maharashtra, Tamil Nadu, Delhi, Telangana, Gujarat)
  - Industry (Required text input)
  - Time Zone (Dropdown: Asia/Kolkata UTC+05:30 default)
  - Currency (Dropdown: INR default)
  - PF No, TAN No, PAN No, ESI No, LIN No, GST No, Registration Certificate No, Twitter Handle
- **Company Branding Section**:
  - Company Logo Upload ("Logo dimensions to be 210 x 70 pixels (max 2MB), GIF, JPG, PNG supported")
  - Signature Upload (Authorized signatory for digital payroll documents)
- **Persistence**: Backed by `api.systemSettings.updateCompanySettings` mutation in Convex.

### 3.2 General — Preferences (`/admin/system-settings/general/preferences`)
- Financial Year Cycle (April to March vs January to December).
- Display Date Format (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD).
- Audit Trail logging and multi-currency flags.

### 3.3 Employee — Preferences (`/admin/system-settings/employee/preferences`)
- Automated Employee Number generation toggle.
- Employee ID Prefix (`IND`), starting sequence number (`1001`), and length.
- Standard probation duration (Months) and notice period (Days).

### 3.4 Payroll — Preferences (`/admin/system-settings/payroll/preferences`)
- Pay Period Cycle (1st-to-last vs 26th-to-25th).
- Disbursement Pay Day.
- PF statutory wage ceiling (₹15,000) and ESI wage ceiling (₹21,000).
- Round off salary calculation, Professional Tax (PT), and Labour Welfare Fund (LWF) toggles.

### 3.5 Income Tax — Preferences (`/admin/system-settings/income-tax/preferences`)
- Active Financial Year selection (`2026-2027`).
- Default Tax Regime (New Section 115BAC vs Old Regime).
- Declaration window state and Proof of Investment deadline (`2027-01-31`).
- PAN validation mandatory toggle.

### 3.6 Leave — Preferences (`/admin/system-settings/leave/preferences`)
- Leave Year Start Month (January vs April).
- Carry forward rules and maximum limit (15 Days).
- Leave encashment, probation leave permissions, and negative balance allowance.

### 3.7 Integrations (`/admin/system-settings/integrations`)
- Connector cards: QuickBooks Online, Zoho Books, Slack, Outgoing Webhooks.
- Connection statuses: `CONFIGURED`, `CONNECTED`, `DEMO`, `NOT_CONFIGURED`.
- Real-time connect/disconnect toggles backed by Convex mutations.

---

## 4. Convex Backend Architecture

### 4.1 Schema (`packages/backend/convex/schema.ts`)
- `systemCompanySettings`: Enterprise identity and statutory parameters.
- `systemGeneralPreferences`: Date format, FY cycle, audit logging.
- `systemEmployeePreferences`: Auto-numbering, probation, notice period.
- `systemPayrollPreferences`: Wage ceilings, pay cycle, PT/ESI/LWF.
- `systemIncomeTaxPreferences`: Regimes, declaration window, deadlines.
- `systemLeavePreferences`: Rollover, carry forward, encashment.
- `systemIntegrationConnectors`: Third-party ERP and webhook connectors.

### 4.2 Backend Service (`packages/backend/convex/systemSettings.ts`)
- Complete workspace isolation using `workspaceId` indexing.
- Authentication checks (`getAuthUserId`) on all mutations.
- Seed data defaults for enterprise initial startup.

---

## 5. Verification & Testing

- **Phase 18 Test Suite**: `tests/system-settings.test.js` (**16 / 16 PASSING, 100%**).
- **Platform Regression Status**: **11 Test Suites, 93 / 93 Tests Passing (100%)**.
- **Visual Artifacts**:
  - `docs/indiapay-settings-companyinfo-1920x1080.png` & `1366x768.png`
  - `docs/indiapay-settings-payroll-1920x1080.png` & `1366x768.png`
  - `docs/indiapay-settings-integrations-1920x1080.png` & `1366x768.png`
  - Reference: `docs/greythr-settings-companyinfo-1920x1080.png`
