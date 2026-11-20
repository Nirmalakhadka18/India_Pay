# IndiaPay — Phase 22: Batch P0 Schema Reference

**Deployment**: `dev:basic-bobcat-92`  
**Schema File**: `packages/backend/convex/schema.ts`  
**Module**: `packages/backend/convex/secureBackendFoundation.ts`  

---

## 1. Table: `loans`

Tracks employee advances and personal loans, interest rates, repayment tenure, and EMI deductions.

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `v.id("workspaces")` | Yes | Tenant scoping |
| `employeeId` | `v.id("employees")` | Yes | Target employee |
| `loanType` | `v.string()` | Yes | Loan type (e.g., `PERSONAL`, `HOME`, `EQUIPMENT`) |
| `principalAmount` | `v.number()` | Yes | Total principal disbursed (INR) |
| `interestRatePercent` | `v.number()` | Yes | Annual interest rate percentage |
| `tenureMonths` | `v.number()` | Yes | Repayment tenure in months |
| `monthlyEmiAmount` | `v.number()` | Yes | Calculated monthly EMI (INR) |
| `disbursedAt` | `v.number()` | Yes | Timestamp of disbursement |
| `disbursedBy` | `v.id("users")` | Yes | User ID of disbursing administrator |
| `status` | `v.string()` | Yes | Status: `ACTIVE`, `CLOSED`, `FORECLOSED` |
| `outstandingPrincipal`| `v.number()` | Yes | Remaining principal amount (INR) |
| `totalRepaid` | `v.number()` | Yes | Sum of principal repaid (INR) |
| `notes` | `v.optional(v.string())` | No | Disbursement remarks |
| `createdAt` | `v.number()` | Yes | Creation timestamp |
| `updatedAt` | `v.number()` | Yes | Last update timestamp |

**Indexes**:
- `by_workspace` on `["workspaceId"]`
- `by_workspace_employee` on `["workspaceId", "employeeId"]`
- `by_workspace_status` on `["workspaceId", "status"]`

---

## 2. Table: `loanRepayments`

Tracks monthly installment deductions against loans through payroll runs.

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `v.id("workspaces")` | Yes | Tenant scoping |
| `loanId` | `v.id("loans")` | Yes | Reference to loan |
| `employeeId` | `v.id("employees")` | Yes | Reference to employee |
| `payrollRunId` | `v.optional(v.id("payrollRuns"))` | No | Payroll run ID if recovered via payroll |
| `repaymentMonth`| `v.string()` | Yes | Billing period (e.g. `2026-11`) |
| `installmentNumber` | `v.number()` | Yes | Installment sequence number |
| `principalPortion` | `v.number()` | Yes | Principal portion of deduction |
| `interestPortion` | `v.number()` | Yes | Interest portion of deduction |
| `totalAmountDeducted` | `v.number()` | Yes | Total deducted installment |
| `status` | `v.string()` | Yes | Status: `DEDUCTED`, `WAIVED`, `DEFAULTED` |
| `deductedAt` | `v.number()` | Yes | Timestamp of deduction |

**Indexes**:
- `by_workspace` on `["workspaceId"]`
- `by_loan` on `["loanId"]`
- `by_workspace_employee` on `["workspaceId", "employeeId"]`
- `by_workspace_month` on `["workspaceId", "repaymentMonth"]`

---

## 3. Table: `reimbursementClaims`

Stores employee expense and tax-exempt reimbursement claims.

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `v.id("workspaces")` | Yes | Tenant scoping |
| `employeeId` | `v.id("employees")` | Yes | Employee filing the claim |
| `claimType` | `v.string()` | Yes | Claim category (e.g., `TRAVEL`, `MEDICAL`) |
| `claimAmount` | `v.number()` | Yes | Claimed amount (INR) |
| `approvedAmount` | `v.optional(v.number())` | No | Approved amount after review |
| `expenseDate` | `v.string()` | Yes | Date expense was incurred (`YYYY-MM-DD`) |
| `description` | `v.string()` | Yes | Description / reason |
| `receiptAttachmentUrl` | `v.optional(v.string())` | No | Receipt proof URL |
| `isTaxExempt` | `v.boolean()` | Yes | Tax-exempt flag under Indian IT Act |
| `status` | `v.string()` | Yes | Status: `SUBMITTED`, `APPROVED`, `REJECTED`, `SETTLED` |
| `reviewedBy` | `v.optional(v.id("users"))` | No | Reviewing admin |
| `reviewedAt` | `v.optional(v.number())` | No | Review timestamp |
| `rejectionReason`| `v.optional(v.string())` | No | Reason if rejected |
| `settledInPayrollRunId` | `v.optional(v.id("payrollRuns"))` | No | Payroll run ID of settlement |
| `createdAt` | `v.number()` | Yes | Creation timestamp |
| `updatedAt` | `v.number()` | Yes | Update timestamp |

**Indexes**:
- `by_workspace` on `["workspaceId"]`
- `by_workspace_employee` on `["workspaceId", "employeeId"]`
- `by_workspace_status` on `["workspaceId", "status"]`

---

## 4. Table: `fnfSettlements`

Full and Final (F&F) settlement records with complete Indian statutory components.

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `v.id("workspaces")` | Yes | Tenant scoping |
| `employeeId` | `v.id("employees")` | Yes | Departing employee |
| `leavingDate` | `v.string()` | Yes | Last working date (`YYYY-MM-DD`) |
| `reasonForLeaving` | `v.string()` | Yes | Exit reason code |
| `serviceTenureYears` | `v.number()` | Yes | Completed tenure in years |
| `lastDrawnBasicSalary` | `v.number()` | Yes | Last drawn basic salary (INR) |
| `exitMonthSalaryPayable`| `v.number()` | Yes | Prorated salary for exit month |
| `earnedLeaveDaysBalance`| `v.number()` | Yes | Unavailed privileged leave days |
| `leaveEncashmentAmount` | `v.number()` | Yes | Earned leave encashment payable |
| `isGratuityEligible` | `v.boolean()` | Yes | Eligible under Gratuity Act (`tenure >= 5 yrs`) |
| `gratuityAmount` | `v.number()` | Yes | `(15 * Basic * Tenure) / 26` |
| `bonusOrExGratia` | `v.number()` | Yes | Statutory bonus / ex-gratia |
| `grossPayable` | `v.number()` | Yes | Gross settlement earnings |
| `noticePeriodShortfallDays` | `v.number()` | Yes | Shortfall days in notice served |
| `noticePayDeduction` | `v.number()` | Yes | Notice period recovery deduction |
| `outstandingLoanRecovery` | `v.number()` | Yes | Outstanding loan balance offset |
| `otherDeductions` | `v.number()` | Yes | Miscellaneous deductions |
| `totalDeductions` | `v.number()` | Yes | Total settlement deductions |
| `netSettlementPayable` | `v.number()` | Yes | Final net disbursement amount |
| `clearanceStatus` | `v.string()` | Yes | Status: `DRAFT`, `DEPT_CLEARED`, `PROCESSED`, `PAID` |
| `calculatedBy` | `v.id("users")` | Yes | Admin who computed F&F |
| `settledAt` | `v.optional(v.number())` | No | Payout timestamp |
| `createdAt` | `v.number()` | Yes | Creation timestamp |
| `updatedAt` | `v.number()` | Yes | Update timestamp |

**Indexes**:
- `by_workspace` on `["workspaceId"]`
- `by_workspace_employee` on `["workspaceId", "employeeId"]`
- `by_workspace_status` on `["workspaceId", "clearanceStatus"]`

---

## 5. Table: `emailLogs`

Email notification audit trail without credentials or secrets.

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `v.id("workspaces")` | Yes | Tenant scoping |
| `recipientEmail` | `v.string()` | Yes | Destination email address |
| `recipientEmployeeId` | `v.optional(v.id("employees"))` | No | Associated employee |
| `subject` | `v.string()` | Yes | Email subject line |
| `templateName` | `v.string()` | Yes | Template identifier |
| `dispatchStatus` | `v.union(...)` | Yes | `QUEUED`, `SENT`, `FAILED`, `BOUNCED`, `NOT_CONFIGURED` |
| `providerMessageId` | `v.optional(v.string())` | No | External provider message ID |
| `errorMessage` | `v.optional(v.string())` | No | Error log (credentials stripped) |
| `sentAt` | `v.optional(v.number())` | No | Timestamp when sent |
| `createdAt` | `v.number()` | Yes | Creation timestamp |

**Indexes**:
- `by_workspace` on `["workspaceId"]`
- `by_workspace_status` on `["workspaceId", "dispatchStatus"]`
- `by_workspace_created` on `["workspaceId", "createdAt"]`

---

## 6. Table: `userImpersonationSessions`

Time-bounded administrative impersonation audit table.

| Field | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `v.id("workspaces")` | Yes | Tenant scoping |
| `adminUserId` | `v.id("users")` | Yes | Super-admin initiator |
| `targetUserId`| `v.id("users")` | Yes | Impersonated target account |
| `businessReason` | `v.string()` | Yes | Mandatory justification |
| `startedAt` | `v.number()` | Yes | Start timestamp |
| `expiresAt` | `v.number()` | Yes | Expiration timestamp (max 30 mins) |
| `endedAt` | `v.optional(v.number())` | No | Termination timestamp |
| `status` | `v.string()` | Yes | `ACTIVE`, `EXPIRED`, `REVOKED` |

**Indexes**:
- `by_workspace` on `["workspaceId"]`
- `by_workspace_status` on `["workspaceId", "status"]`
- `by_admin` on `["adminUserId"]`
- `by_target` on `["targetUserId"]`
