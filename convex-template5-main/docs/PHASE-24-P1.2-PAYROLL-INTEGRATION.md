# IndiaPay Phase 24 — P1.2: Payroll Reimbursement Integration

## 1. Integration Points

1. **`calculatePreview` (`packages/backend/convex/payroll.ts`)**:
   - Queries all claims for each employee where `status: "APPROVED"`.
   - Computes `totalReimbursements` in integer paisa.
   - Adds reimbursements to net salary:
     ```typescript
     const netSalary = Math.max(0, grossPay - totalDeductions - totalLoanDeduction + totalReimbursements);
     ```
   - Emits `reimbursementBreakdown` inside employee payroll preview.

2. **`createRun` (`packages/backend/convex/payroll.ts`)**:
   - Persists `totalReimbursements` and `reimbursementItems` on `payrollItems`.
   - Sets claim status to `PROCESSING` to lock them against concurrent edits or withdrawals.

3. **`finalizeRun` (`packages/backend/convex/payroll.ts`)**:
   - Atomically updates included claims to `status: "SETTLED"`.
   - Populates `settledInPayrollRunId: runId` and `settledAt: Date.now()`.
   - Logs settlement in `reimbursementAuditLogs`.

## 2. Tax Treatment Handling

- **Non-Taxable Business Expenses (`NON_TAXABLE_BUSINESS`)**: Excluded from taxable income and gross salary.
- **Potentially Exempt (`POTENTIALLY_EXEMPT`)**: Excluded up to statutory limits when supported by receipts.
- **Taxable Additions (`TAXABLE`)**: Flagged for inclusion in taxable earnings for annual TDS computation without distorting base statutory wage definitions.
