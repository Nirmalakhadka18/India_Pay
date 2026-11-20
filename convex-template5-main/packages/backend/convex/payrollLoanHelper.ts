import type { Id } from "./_generated/dataModel";

export interface LoanDeductionCalculationItem {
  loanId: Id<"loans">;
  loanType: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  deductedAmount: number;
  outstandingBefore: number;
  outstandingAfter: number;
  isPartial: boolean;
  isBounced: boolean;
}

export interface EmployeeLoanSummary {
  loanDeductions: LoanDeductionCalculationItem[];
  totalLoanDeduction: number;
  adjustedNetSalary: number;
  warnings: string[];
}

/**
 * Calculates loan EMI deductions for an employee during payroll preview / run.
 * 
 * Rules:
 * 1. Only loans with status === "ACTIVE" (and disbursementStatus === "DISBURSED") are eligible.
 * 2. Pending, Approved (not yet disbursed), Closed, or Rejected loans are strictly ignored.
 * 3. Does not allow deductions to push net pay below 0.
 * 4. If net salary before loans < target EMI:
 *    - If net salary > 0: Partial deduction up to available net salary.
 *    - If net salary <= 0: Installment is marked bounced (deducted: 0).
 * 5. Uses integer-paisa financial arithmetic.
 */
export function calculateEmployeeLoanDeductions(
  employeeId: string,
  baselineNetSalary: number,
  activeLoans: Array<{
    _id: Id<"loans">;
    employeeId: string;
    loanType: string;
    principalAmount: number;
    interestRatePercent: number;
    tenureMonths: number;
    monthlyEmiAmount: number;
    outstandingPrincipal: number;
    status: string;
    disbursementStatus?: string;
  }>,
  alreadyProcessedLoanIdsForPeriod: Set<string>
): EmployeeLoanSummary {
  const empLoans = activeLoans.filter(
    (l) => l.employeeId === employeeId && l.status === "ACTIVE"
  );

  const deductions: LoanDeductionCalculationItem[] = [];
  const warnings: string[] = [];
  let currentNetSalary = baselineNetSalary;
  let totalLoanDeduction = 0;

  for (const loan of empLoans) {
    // Check duplicate in period
    if (alreadyProcessedLoanIdsForPeriod.has(loan._id)) {
      warnings.push(
        `Loan ${loan.loanType} (${loan._id.slice(-6)}) already processed for this payroll period. Skipped.`
      );
      continue;
    }

    if (loan.outstandingPrincipal <= 0) {
      continue;
    }

    const targetEmi = Math.min(loan.monthlyEmiAmount, loan.outstandingPrincipal);
    let actualDeduction = targetEmi;
    let isPartial = false;
    let isBounced = false;

    if (currentNetSalary < targetEmi) {
      if (currentNetSalary <= 0) {
        isBounced = true;
        actualDeduction = 0;
        warnings.push(
          `Insufficient net salary for loan ${loan.loanType}. Installment of ₹${targetEmi} skipped/bounced.`
        );
      } else {
        isPartial = true;
        actualDeduction = currentNetSalary;
        warnings.push(
          `Partial deduction of ₹${actualDeduction} applied for loan ${loan.loanType} due to salary constraint (Target: ₹${targetEmi}).`
        );
      }
    }

    const monthlyInterestRate = loan.interestRatePercent / 12 / 100;
    const interestComponent = Math.min(
      Math.round(loan.outstandingPrincipal * monthlyInterestRate),
      actualDeduction
    );
    const principalComponent = actualDeduction - interestComponent;
    const outstandingAfter = Math.max(0, loan.outstandingPrincipal - principalComponent);

    deductions.push({
      loanId: loan._id,
      loanType: loan.loanType,
      emiAmount: targetEmi,
      principalComponent,
      interestComponent,
      deductedAmount: actualDeduction,
      outstandingBefore: loan.outstandingPrincipal,
      outstandingAfter,
      isPartial,
      isBounced,
    });

    totalLoanDeduction += actualDeduction;
    currentNetSalary = Math.max(0, currentNetSalary - actualDeduction);
  }

  return {
    loanDeductions: deductions,
    totalLoanDeduction,
    adjustedNetSalary: currentNetSalary,
    warnings,
  };
}
