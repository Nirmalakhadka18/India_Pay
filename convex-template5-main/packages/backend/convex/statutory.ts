// Helper to check days in month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export interface CalculationContext {
  totalDaysInMonth: number;
  month: number;
  lopSettings: {
    calculationBasis: "calendar_days" | "fixed_30_days" | "working_days";
    includeUnpaidLeave: boolean;
    includeAbsent: boolean;
    halfDayFactor: number;
  };
  workspaceCompliance: {
    epfEnabled: boolean;
    epfWageCeiling?: number;
    epfRestrictToCeiling?: boolean;
    epsEnabled?: boolean;
    epsWageCeiling?: number;
    edliEnabled?: boolean;
    adminChargesEnabled?: boolean;
    esiEnabled: boolean;
    esiWageCeiling?: number;
    ptEnabled: boolean;
    ptState?: string;
  };
}

// Statutory payroll computation engine for Indian payroll rules
export function computeEmployeePayrollItem(
  emp: {
    _id: any;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  },
  salary: any | undefined,
  empAttendance: { status: string }[],
  empComp: any | undefined,
  calcCtx: CalculationContext
) {
  const warnings: string[] = [];
  let basicSalary = 0;
  let allowances: { name: string; amount: number }[] = [];
  let customDeductions: { name: string; amount: number }[] = [];
  let grossSalary = 0;
  let hasSalaryStructure = true;

  if (!salary) {
    hasSalaryStructure = false;
    warnings.push("Missing salary structure. Gross salary set to ₹0.");
  } else {
    basicSalary = Math.max(0, salary.basicSalary || 0);
    allowances = salary.allowances ?? [];
    customDeductions = salary.deductions ?? [];
    grossSalary = Math.max(0, salary.grossSalary || 0);
  }

  // 1. Loss of Pay (LOP) calculation
  let lopDays = 0;
  for (const rec of empAttendance) {
    if (rec.status === "absent" && calcCtx.lopSettings.includeAbsent) {
      lopDays += 1;
    } else if (rec.status === "unpaid_leave" && calcCtx.lopSettings.includeUnpaidLeave) {
      lopDays += 1;
    } else if (rec.status === "half_day") {
      lopDays += calcCtx.lopSettings.halfDayFactor;
    }
  }

  let dailyRate = 0;
  if (calcCtx.lopSettings.calculationBasis === "calendar_days") {
    dailyRate = calcCtx.totalDaysInMonth > 0 ? grossSalary / calcCtx.totalDaysInMonth : 0;
  } else if (calcCtx.lopSettings.calculationBasis === "fixed_30_days") {
    dailyRate = grossSalary / 30;
  } else {
    dailyRate = calcCtx.totalDaysInMonth > 0 ? grossSalary / calcCtx.totalDaysInMonth : 0;
  }

  const lopDeduction = Math.round(lopDays * dailyRate);
  const totalCustomDeductions = customDeductions.reduce((sum, d) => sum + d.amount, 0);

  // 2. Statutory EPF / EPS / EDLI / Admin calculations
  // Statutory wage ceiling under EPF Act 1952 is ₹15,000/month (configurable per workspace)
  const isEpfOptOut = empComp?.epfOptOut ?? false;
  const isEpfEnabled = calcCtx.workspaceCompliance.epfEnabled && !isEpfOptOut;

  let epfEmployee = 0;
  let epfEmployer = 0;
  let epsEmployer = 0;
  let edliEmployer = 0;
  let adminChargesEmployer = 0;

  if (isEpfEnabled) {
    const wageCeiling = calcCtx.workspaceCompliance.epfWageCeiling ?? 15000;
    const restrictToCeiling = calcCtx.workspaceCompliance.epfRestrictToCeiling ?? true;
    const voluntaryActualBasic = empComp?.epfOnActualBasic ?? false;

    // Eligible wage determination:
    // If voluntary actual basic is elected (by employee or workspace), use full basicSalary;
    // otherwise enforce statutory wage ceiling.
    const eligibleWage = (voluntaryActualBasic || !restrictToCeiling)
      ? basicSalary
      : Math.min(basicSalary, wageCeiling);

    // Employee EPF: 12% of eligible wage
    epfEmployee = Math.round(eligibleWage * 0.12);

    // Employer EPS: 8.33% subject to statutory EPS ceiling (default ₹15,000, capping EPS at ₹1,250)
    const isEpsEnabled = calcCtx.workspaceCompliance.epsEnabled ?? true;
    const epsCeiling = calcCtx.workspaceCompliance.epsWageCeiling ?? 15000;
    if (isEpsEnabled) {
      const epsEligibleWage = Math.min(eligibleWage, epsCeiling);
      // Under EPFO rules, 8.33% of 15000 = 1249.50, officially rounded to 1,250
      epsEmployer = Math.min(1250, Math.round(epsEligibleWage * 0.0833));
    }

    // Employer EPF share: remainder of 12% employer PF after deducting EPS
    const totalEmployerPf = Math.round(eligibleWage * 0.12);
    epfEmployer = Math.max(0, totalEmployerPf - epsEmployer);

    // EDLI: 0.5% (capped at ₹15,000 wage ceiling -> max ₹75/month)
    const isEdliEnabled = calcCtx.workspaceCompliance.edliEnabled ?? true;
    if (isEdliEnabled) {
      const edliEligibleWage = Math.min(eligibleWage, 15000);
      edliEmployer = Math.min(75, Math.round(edliEligibleWage * 0.005));
    }

    // EPFO Admin charges: 0.5%
    const isAdminEnabled = calcCtx.workspaceCompliance.adminChargesEnabled ?? true;
    if (isAdminEnabled) {
      adminChargesEmployer = Math.round(eligibleWage * 0.005);
    }
  }

  // 3. ESI calculation
  let esiEmployee = 0;
  let esiEmployer = 0;
  const esiCeiling = calcCtx.workspaceCompliance.esiWageCeiling ?? 21000;
  if (calcCtx.workspaceCompliance.esiEnabled && grossSalary > 0 && grossSalary <= esiCeiling) {
    esiEmployee = Math.ceil(grossSalary * 0.0075);
    esiEmployer = Math.ceil(grossSalary * 0.0325);
  }

  // 4. Professional Tax (Karnataka state slabs)
  let ptAmount = 0;
  if (calcCtx.workspaceCompliance.ptEnabled && calcCtx.workspaceCompliance.ptState === "Karnataka") {
    if (grossSalary >= 25000) {
      // Karnataka PT is ₹300 in February, ₹200 in all other months
      ptAmount = calcCtx.month === 2 ? 300 : 200;
    }
  }

  // 5. TDS: Manual monthly override (No automated tax regime slab engine)
  const tdsOverride = empComp?.tdsOverride;
  const tdsAmount = Math.max(0, tdsOverride ?? 0);

  // Line items
  const statutoryDeductions = [
    { name: "PF (Provident Fund - 12%)", amount: epfEmployee, isConfigured: isEpfEnabled },
    { name: "ESI (Employee State Insurance - 0.75%)", amount: esiEmployee, isConfigured: calcCtx.workspaceCompliance.esiEnabled },
    { name: "Professional Tax (PT)", amount: ptAmount, isConfigured: calcCtx.workspaceCompliance.ptEnabled },
    { name: "TDS (Manual Override - Non-automated)", amount: tdsAmount, isConfigured: true },
  ];
  const totalStatutoryDeductions = epfEmployee + esiEmployee + ptAmount + tdsAmount;

  const employerContributions = [
    { name: "Employer EPF (3.67% share)", amount: epfEmployer, isConfigured: isEpfEnabled },
    { name: "Employer EPS (8.33% Pension, capped at ₹1,250)", amount: epsEmployer, isConfigured: isEpfEnabled && (calcCtx.workspaceCompliance.epsEnabled ?? true) },
    { name: "EDLI (0.5% Insurance)", amount: edliEmployer, isConfigured: isEpfEnabled && (calcCtx.workspaceCompliance.edliEnabled ?? true) },
    { name: "EPFO Admin Charges (0.5%)", amount: adminChargesEmployer, isConfigured: isEpfEnabled && (calcCtx.workspaceCompliance.adminChargesEnabled ?? true) },
    { name: "Employer ESI (3.25%)", amount: esiEmployer, isConfigured: calcCtx.workspaceCompliance.esiEnabled },
  ];
  const totalEmployerContributions =
    epfEmployer + epsEmployer + edliEmployer + adminChargesEmployer + esiEmployer;

  const totalDeductions = lopDeduction + totalCustomDeductions + totalStatutoryDeductions;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    employeeId: emp._id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    department: emp.department ?? "General",
    ...(salary ? { salaryId: salary._id } : {}),
    basicSalary,
    allowances,
    grossSalary,
    lopDays,
    lopDeduction,
    customDeductions,
    totalCustomDeductions,
    statutoryDeductions,
    totalStatutoryDeductions,
    employerContributions,
    totalEmployerContributions,
    totalDeductions,
    netSalary,
    hasSalaryStructure,
    warnings,
  };
}
