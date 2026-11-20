# INDIA PAY — BACKEND, SCHEMA & SECURITY GAP REPORT

**Project:** IndiaPay HRMS  
**Backend:** Convex (`packages/backend`)  
**Target Deployment:** `dev:basic-bobcat-92` (`https://basic-bobcat-92.convex.cloud`)  
**Date:** November 19, 2026  

---

## 1. Schema & Database Models Audit

### Currently Implemented Tables (`packages/backend/convex/schema.ts`):
- `workspaces` & `members`: Multi-tenant workspace partitioning and role mapping.
- `users`: Core authentication identity records.
- `employees`: Employee master demographics, department, designation, PAN, UAN, bank details.
- `salaries`: Salary structures, basic, gross, allowances.
- `payrollRuns`: Payroll execution state, total payout, employee counts.
- `leaveRequests`: Leave applications, start/end dates, approval statuses.
- `attendance`: Daily punch records, biometric sync entries.
- `feedPosts`, `reactions`, `comments`, `polls`: Engage social collaboration.
- `marketplaceApps`, `installedApps`, `notifications`: Unite marketplace.
- `accountPlans`, `invoices`, `tickets`: Subscription and billing.
- `systemListOfValues`, `systemBankBranches`, `systemCompanyBanks`, `systemStates`, `systemEmployeeNoSeries`, `systemTransitionGroups`: System Settings tables.

### Identified Schema Gaps (Tables Needed for 100% Parity):
1. `loans`: Table required to track employee loan disbursements, total principal, interest rates, EMI amounts, and remaining balances.
2. `reimbursementClaims`: Table required to store itemized claims, bill uploads, tax-exempt categorizations, and manager approval timestamps.
3. `statutoryRegisters`: Table to persist state-specific annual and monthly return filings.
4. `emailLogs`: Table to log all outbound system emails, SMTP dispatch states, and bounce events.
5. `userImpersonationSessions`: Table to record administrator session masquerades for audit compliance.

---

## 2. Server-Side Security & Tenant Isolation

1. **Authentication Enforcement**:
   - Every operational query and mutation in `orgs.ts`, `workspaces.ts`, `employees.ts`, `salaries.ts`, `payroll.ts`, and `reports.ts` begins with `getAuthUserId(ctx)` and throws `ConvexError("Not authenticated")` if unauthenticated.
2. **Workspace Isolation**:
   - Queries enforce workspace scoping via indexed database filters: `.withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId))`.
   - Access control helper `requireMember(ctx, userId, workspaceId)` ensures users from one tenant cannot query or mutate records belonging to another tenant.
3. **Data Masking Compliance**:
   - In `reports:generateReportData` and employee profile APIs, sensitive fields (`pan`, `bankAccountNumber`, `ifscCode`) are masked (`••••1234`) for non-admin viewers. Only users holding the verified `admin` role in `members` receive unmasked banking data.

---

## 3. Deployment Health Check

- Development synchronization confirmed functional on `dev:basic-bobcat-92`.
- Zero compilation blockers: `workspaces.ts`, `systemSettings.ts`, `reports.ts`, and `marketplace.ts` are bundled and deployed.
