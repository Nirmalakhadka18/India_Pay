import type { Doc, Id } from "./_generated/dataModel";

export interface ReimbursementCalculationItem {
  claimId: Id<"reimbursementClaims">;
  claimNumber: string;
  categoryCode: string;
  taxTreatment: string;
  approvedAmount: number;
  isTaxExempt: boolean;
}

export interface EmployeeReimbursementSummary {
  reimbursementItems: ReimbursementCalculationItem[];
  totalReimbursement: number;
  totalTaxableReimbursement: number;
  totalTaxExemptReimbursement: number;
}

/**
 * Calculates approved employee reimbursement amounts for inclusion in payroll.
 *
 * Requirements:
 * 1. Only fully APPROVED claims are eligible.
 * 2. Unapproved, submitted, rejected, held, draft, or already settled claims are strictly excluded.
 * 3. Reimbursements are payout additions (they do NOT reduce gross salary or statutory deductions).
 * 4. Distinctly separates taxable vs tax-exempt components.
 */
export function calculateEmployeeReimbursements(
  employeeId: string,
  approvedClaims: Array<{
    _id: Id<"reimbursementClaims">;
    claimNumber: string;
    employeeId: string;
    categoryCode: string;
    claimAmount: number;
    approvedAmount?: number;
    taxTreatment: string;
    isTaxExempt: boolean;
    status: string;
    settledInPayrollMonth?: string;
  }>
): EmployeeReimbursementSummary {
  const eligibleClaims = approvedClaims.filter(
    (c) => c.employeeId === employeeId && c.status === "APPROVED" && !c.settledInPayrollMonth
  );

  const reimbursementItems: ReimbursementCalculationItem[] = [];
  let totalReimbursement = 0;
  let totalTaxableReimbursement = 0;
  let totalTaxExemptReimbursement = 0;

  for (const claim of eligibleClaims) {
    const amount = claim.approvedAmount ?? claim.claimAmount;
    reimbursementItems.push({
      claimId: claim._id,
      claimNumber: claim.claimNumber,
      categoryCode: claim.categoryCode,
      taxTreatment: claim.taxTreatment,
      approvedAmount: amount,
      isTaxExempt: claim.isTaxExempt,
    });

    totalReimbursement += amount;
    if (claim.isTaxExempt) {
      totalTaxExemptReimbursement += amount;
    } else {
      totalTaxableReimbursement += amount;
    }
  }

  return {
    reimbursementItems,
    totalReimbursement,
    totalTaxableReimbursement,
    totalTaxExemptReimbursement,
  };
}
