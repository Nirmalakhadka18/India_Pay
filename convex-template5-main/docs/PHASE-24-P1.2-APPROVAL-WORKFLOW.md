# IndiaPay Phase 24 — P1.2: Reimbursement Approval Workflow

## 1. Approval State Machine & Transitions

The reimbursement engine supports an enterprise multi-tier approval workflow modeled after greytHR:

```
[DRAFT]
   │
   ▼
[SUBMITTED]
   │
   ▼
[MANAGER_REVIEW] ──(Reject)──► [REJECTED]
   │            ──(Return)──► [RETURNED_FOR_CORRECTION] ──► [SUBMITTED]
   ▼ (Approve)
[FINANCE_REVIEW] ──(Reject)──► [REJECTED]
   │             ──(Hold)────► [ON_HOLD] ──► [FINANCE_REVIEW]
   ▼ (Approve with Adjusted Amount)
[APPROVED]
   │
   ▼
[PROCESSING] (Included in active Payroll Run)
   │
   ▼
[SETTLED] (Finalized Payroll Run)
```

## 2. Separation of Duties Policy

- **Self-Approval Prohibited**:
  Employees cannot approve their own reimbursement claims. Even if a workspace owner or manager submits an expense voucher, they must have it reviewed and approved by another designated approver or finance administrator.
- **Audit Logging**:
  Every stage transition records the actor's user ID, previous status, new status, timestamp, and review remarks in `reimbursementAuditLogs`.

## 3. Workflow Actions

1. `managerReviewClaim`:
   - `APPROVE`: Transitions to `FINANCE_REVIEW` (or directly to `APPROVED` if category doesn't require finance review).
   - `REJECT`: Rejection with mandatory justification.
   - `RETURN`: Returns claim to employee to upload missing receipts or correct details.
2. `financeReviewClaim`:
   - `APPROVE`: Allows finance to approve the full or adjusted amount (e.g., partial disallowance of GST/alcohol charges), transition to `APPROVED`.
   - `REJECT`: Rejection with mandatory comments.
   - `HOLD`: Marks as `ON_HOLD` pending vendor invoice verification.
3. `cancelClaim`:
   - Employees may cancel their claim prior to approval.
