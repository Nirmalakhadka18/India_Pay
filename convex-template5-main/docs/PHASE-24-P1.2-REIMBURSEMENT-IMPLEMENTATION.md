# IndiaPay Phase 24 — P1.2: Reimbursement Claims & Approval Workflow Implementation Report

**Target Deployment**: `dev:basic-bobcat-92` (`https://basic-bobcat-92.convex.cloud`)  
**Status**: COMPLETE (All 30/30 Discrete P1.2 Requirements Passed, 25/25 Platform Suites 100% Green)

---

## 1. Executive Summary

In Phase 24 (P1.2), IndiaPay implemented the complete **Employee Reimbursement Management and Multi-Stage Approval Workflow Engine**. The architecture replicates enterprise greytHR capabilities, ensuring that expense reimbursements flow cleanly from submission through manager and finance approvals to automatic inclusion and settlement in monthly payroll runs.

### Core Capabilities Delivered:
1. **Configurable Reimbursement Categories & Tax Treatment**:
   - `TRAVEL`, `MEALS`, `TELECOM`, `FUEL`, `MEDICAL` pre-seeded with configurable limits, receipt policies, and Indian tax treatment classifications:
     - `NON_TAXABLE_BUSINESS`: Pure business expense reimbursement (non-taxable).
     - `POTENTIALLY_EXEMPT`: Statutory tax exemptions (e.g. medical, fuel, LTA vouchers up to prescribed thresholds).
     - `TAXABLE`: Cash allowances or unverified expense additions subject to TDS.
     - `REQUIRES_REVIEW`: Flagged for finance scrutiny.
2. **Multi-Stage Approval Lifecycle**:
   - `DRAFT` $\to$ `SUBMITTED` $\to$ `MANAGER_REVIEW` $\to$ `FINANCE_REVIEW` $\to$ `APPROVED` $\to$ `PROCESSING` $\to$ `SETTLED`.
   - Supports exception workflows: `REJECTED`, `RETURNED_FOR_CORRECTION`, `ON_HOLD`, `CANCELLED`.
3. **Strict Separation of Duties & Security Governance**:
   - Self-approval blocked server-side: an employee (even if holding workspace admin rights) cannot approve or verify their own expense claims.
   - Cross-tenant access isolation validated at mutation and query boundaries.
4. **Core Payroll Pipeline Integration**:
   - Approved reimbursements are automatically pulled into `calculatePreview` as payout additions.
   - They do not distort statutory base salaries (PF, ESI, PT) or deductions.
   - Upon finalization (`finalizeRun`), claims are marked `SETTLED`, stamped with `settledInPayrollRunId`, and prevented from duplicate payouts.
5. **UI & User Experience**:
   - **Admin Reimbursement Management Console** at `/admin/payroll/reimbursements`: metrics cards, filterable claims register, category policy seeder, manager & finance review drawers.
   - **Employee Self-Service (ESS) Portal** at `/salary/reimbursement`: claim submission modal, category guidelines, receipt attachment, status tracker.

---

## 2. Backend Data Models (`packages/backend/convex/schema.ts`)

```typescript
// 1. Reimbursement Categories
reimbursementCategories: defineTable({
  workspaceId: v.id("workspaces"),
  categoryCode: v.string(),
  categoryName: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),
  maxClaimLimit: v.optional(v.number()), // in paisa
  receiptRequired: v.boolean(),
  taxTreatment: v.union(
    v.literal("TAXABLE"),
    v.literal("POTENTIALLY_EXEMPT"),
    v.literal("NON_TAXABLE_BUSINESS"),
    v.literal("REQUIRES_REVIEW")
  ),
  requiresManagerApproval: v.boolean(),
  requiresFinanceApproval: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_workspace_code", ["workspaceId", "categoryCode"]),

// 2. Extended Reimbursement Claims
reimbursementClaims: defineTable({
  workspaceId: v.id("workspaces"),
  employeeId: v.id("employees"),
  claimNumber: v.string(),
  categoryCode: v.string(),
  claimedAmount: v.number(), // in paisa
  approvedAmount: v.optional(v.number()), // in paisa
  expenseDate: v.string(), // YYYY-MM-DD
  businessPurpose: v.string(),
  receiptUrls: v.array(v.string()),
  paymentMethod: v.optional(v.string()),
  referenceNumber: v.optional(v.string()),
  taxTreatment: v.union(
    v.literal("TAXABLE"),
    v.literal("POTENTIALLY_EXEMPT"),
    v.literal("NON_TAXABLE_BUSINESS"),
    v.literal("REQUIRES_REVIEW")
  ),
  status: v.union(
    v.literal("DRAFT"),
    v.literal("SUBMITTED"),
    v.literal("MANAGER_REVIEW"),
    v.literal("FINANCE_REVIEW"),
    v.literal("APPROVED"),
    v.literal("REJECTED"),
    v.literal("RETURNED_FOR_CORRECTION"),
    v.literal("ON_HOLD"),
    v.literal("PROCESSING"),
    v.literal("SETTLED"),
    v.literal("CANCELLED")
  ),
  managerReviewedBy: v.optional(v.string()),
  managerReviewedAt: v.optional(v.number()),
  managerComments: v.optional(v.string()),
  financeReviewedBy: v.optional(v.string()),
  financeReviewedAt: v.optional(v.number()),
  financeComments: v.optional(v.string()),
  holdReason: v.optional(v.string()),
  settledInPayrollRunId: v.optional(v.id("payrollRuns")),
  submittedAt: v.optional(v.number()),
  settledAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_workspace_employee", ["workspaceId", "employeeId"])
  .index("by_workspace_status", ["workspaceId", "status"])
  .index("by_workspace_claim_number", ["workspaceId", "claimNumber"]),

// 3. Reimbursement Audit Logs
reimbursementAuditLogs: defineTable({
  workspaceId: v.id("workspaces"),
  claimId: v.id("reimbursementClaims"),
  action: v.string(),
  actorUserId: v.string(),
  fromStatus: v.optional(v.string()),
  toStatus: v.string(),
  notes: v.optional(v.string()),
  timestamp: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_claim", ["claimId"]),
```

---

## 3. Financial & Precision Calculations

- All amounts are stored and computed in **integer paisa** (₹1.00 = 100 paisa) to eliminate floating-point rounding errors.
- Reimbursements are treated as **salary additions**:
  $$\text{Net Pay} = \text{Gross Earnings} - \text{Total Deductions} - \text{Loan EMI} + \text{Approved Reimbursements}$$
- Reimbursements do not inflate statutory Provident Fund (PF) or Employee State Insurance (ESI) contributions.
