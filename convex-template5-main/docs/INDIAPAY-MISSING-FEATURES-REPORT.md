# INDIA PAY — MISSING FEATURES & FUNCTIONAL GAPS REPORT

**Project:** IndiaPay HRMS  
**Audit Source:** Authenticated Victor Chasex greytHR application  
**Date:** November 19, 2026  
**Status:** AUDIT ONLY — GAP SPECIFICATION

---

## 1. Strictly Missing Features (Count: 2)

These features exist in the authenticated greytHR application but currently have no equivalent route or component in IndiaPay:

### 1. Minor Puppetry (Administrator User Impersonation)
- **Reference Location:** Sys Admin Backroom -> Minor Puppetry (`/ngapp/settings/sysadmin/puppetry`)
- **Capability:** Allows Super Administrators to temporarily sign in as another specific employee to audit exact ESS permissions, view what the employee sees, and troubleshoot access discrepancies without acquiring the employee's credentials.
- **IndiaPay Gap:** No impersonation session middleware or UI banner ("Currently acting as...") is implemented.

### 2. SMTP Email Delivery & Gateway Logs
- **Reference Location:** Sys Admin Backroom -> Email Delivery Logs (`/ngapp/settings/sysadmin/email-logs`)
- **Capability:** A real-time audit trail of all automated emails dispatched by greytHR (payslip dispatches, OTPs, leave approval notifications, onboarding invites), including recipient address, subject, dispatch timestamp, delivery status, and bounce error codes.
- **IndiaPay Gap:** IndiaPay dispatches emails via Resend/SMTP but does not persist an outbound email delivery event log table for administrators.

---

## 2. Partially Implemented Features (Count: 62)

These features have existing UI forms or modal workflows in IndiaPay, but their underlying calculation logic or database persistence is partial:

### 1. Full & Final Settlement (F&F) Calculator (`/admin/payroll/information`)
- **Current State:** Form collects exit date and settlement notes.
- **Missing Logic:** Automated calculation of pro-rated salary for the exit month, encashment of remaining earned leave balances, statutory gratuity computation (under the Payment of Gratuity Act: `(15 * Last Drawn Basic * Tenure) / 26`), and recovery of notice pay shortages or outstanding asset loans.

### 2. Specialized Claims & Loan Disbursements (`/reports`)
- **Current State:** Appears in Reports Gallery and outputs employee demographic records.
- **Missing Logic:** Dedicated database tables for loan applications, EMI amortization schedules, interest calculations, and reimbursement claim approval vouchers.

### 3. Income Tax Declarations Master & Slabs (`/admin/system-settings/income-tax/preferences`)
- **Current State:** Global toggle for Old vs New Tax Regime.
- **Missing Logic:** Granular section masters (Section 80C ₹1.5L cap, Section 80D medical insurance, HRA exemption computation under Rule 2A, Chapter VI-A deductions, and custom employer perquisite rules).

### 4. Advanced Shift Roster Planning (`/admin/leave/overview`)
- **Current State:** Standard morning, afternoon, evening, and general shifts.
- **Missing Logic:** Shift rotation templates (e.g. 6-days-on/2-days-off, 24/7 rotational night shifts), automated break duration deduction, and grace-period late mark rules.

---

## 3. UI-Only Templates Requiring Dedicated Form Engines (Count: 212)

### 1. 67 Statutory Act Register Reports in Reports Gallery
- Specialized Indian labor law registers (e.g., Karnataka Factories Act Form 22, CLRA Form XVII, Minimum Wages Form V, Payment of Bonus Form D, Tamil Nadu LWF Form A) that currently generate standard employee listings rather than the customized statutory multi-page legal forms.

### 2. 145 Granular System Settings Submenus
- Granular settings pages across General, Payroll, Income Tax, Leave, and More that currently navigate to shared category settings preference hubs.
