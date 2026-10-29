import { describe, expect, test } from "vitest";
import {
  computeEmployeePayrollItem,
  type CalculationContext,
  type EmployeeInput,
} from "./statutory";

const defaultCtx: CalculationContext = {
  totalDaysInMonth: 30,
  month: 4,
  lopSettings: {
    calculationBasis: "calendar_days",
    includeUnpaidLeave: true,
    includeAbsent: true,
    halfDayFactor: 0.5,
  },
  workspaceCompliance: {
    epfEnabled: true,
    epfWageCeiling: 25000,
    epfRestrictToCeiling: true,
    epsEnabled: true,
    epsWageCeiling: 15000,
    edliEnabled: true,
    adminChargesEnabled: true,
    esiEnabled: true,
    esiWageCeiling: 21000,
    ptEnabled: true,
    ptState: "Karnataka",
  },
};

describe("Employer-Confirmed PF & ESI Wage Rules — Synthetic Regression Suite", () => {
  // 1. PF calculation for a general employee with a ₹25,000 ceiling
  test("1. General employee PF calculation respects the ₹25,000 wage ceiling", () => {
    const generalEmp: EmployeeInput = {
      _id: "emp_gen" as any,
      firstName: "Rohan",
      lastName: "Sharma",
      email: "rohan@example.com",
      isPfMember: true,
      isEsiMember: false,
    };
    const salary = {
      basicSalary: 30000,
      allowances: [
        { name: "HRA", amount: 10000 },
        { name: "Special Allowance", amount: 5000 },
      ],
      grossSalary: 45000,
    };

    const result = computeEmployeePayrollItem(generalEmp, salary, [], undefined, defaultCtx);
    const pfDed = result.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    const epfEmployer = result.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    const epsEmployer = result.employerContributions.find((c) => c.name.startsWith("Employer EPS"))?.amount;

    // Eligible wage is capped at ₹25,000
    // Employee PF: 12% of 25,000 = 3,000
    expect(pfDed).toBe(3000);
    // EPS capped at statutory ₹15,000 ceiling: 8.33% = 1,250
    expect(epsEmployer).toBe(1250);
    // Employer EPF: 3,000 - 1,250 = 1,750
    expect(epfEmployer).toBe(1750);
    expect((epfEmployer ?? 0) + (epsEmployer ?? 0)).toBe(3000);
  });

  // 2. PF wage base for an ESI-compliant employee, excluding HRA but including other applicable allowances
  test("2. ESI-compliant employee PF wage base includes all allowances except HRA", () => {
    const esiEmp: EmployeeInput = {
      _id: "emp_esi" as any,
      firstName: "Sunita",
      lastName: "Rao",
      email: "sunita@example.com",
      isPfMember: true,
      isEsiMember: true,
      esicIpNumber: "3100123456",
    };
    const salary = {
      basicSalary: 12000,
      allowances: [
        { name: "HRA", amount: 6000 },
        { name: "Special Allowance", amount: 4000 },
        { name: "Conveyance", amount: 2000 },
        { name: "Medical Allowance", amount: 1000 },
      ],
      grossSalary: 25000,
    };

    const result = computeEmployeePayrollItem(esiEmp, salary, [], undefined, defaultCtx);
    const pfDed = result.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    const epfEmployer = result.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    const epsEmployer = result.employerContributions.find((c) => c.name.startsWith("Employer EPS"))?.amount;

    // PF Wage Base = Basic (12000) + Special (4000) + Conveyance (2000) + Medical (1000) = 19,000 (HRA excluded)
    // Eligible wage = min(19000, 25000) = 19,000
    // Employee PF (12% of 19000) = 2,280
    expect(pfDed).toBe(2280);
    // Total Employer PF 12% = 2,280
    // EPS 8.33% on min(19000, 15000) = 1,250
    expect(epsEmployer).toBe(1250);
    // Employer EPF share = 2280 - 1250 = 1,030
    expect(epfEmployer).toBe(1030);
  });

  // 3. ESI wages using Basic + Special Allowance only
  test("3. ESI wages strictly consist of Basic + Special Allowance only", () => {
    const emp: EmployeeInput = {
      _id: "emp_3" as any,
      firstName: "Amit",
      lastName: "Verma",
      email: "amit@example.com",
      isEsiMember: true,
    };
    const salary = {
      basicSalary: 10000,
      allowances: [
        { name: "Special Allowance", amount: 5000 },
        { name: "Bonus", amount: 3000 },
      ],
      grossSalary: 18000,
    };

    const result = computeEmployeePayrollItem(emp, salary, [], undefined, defaultCtx);
    const esiEmployee = result.statutoryDeductions.find((d) => d.name.startsWith("ESI"))?.amount;
    const esiEmployer = result.employerContributions.find((c) => c.name.startsWith("Employer ESI"))?.amount;

    // ESI wages = 10,000 + 5,000 = 15,000 (Bonus not included in confirmed formula)
    // Employee ESI: ceil(15000 * 0.0075) = 113
    expect(esiEmployee).toBe(113);
    // Employer ESI: ceil(15000 * 0.0325) = 488
    expect(esiEmployer).toBe(488);
  });

  // 4. ESI calculations excluding HRA and Conveyance
  test("4. ESI calculation strictly excludes HRA and Conveyance", () => {
    const emp: EmployeeInput = {
      _id: "emp_4" as any,
      firstName: "Deepa",
      lastName: "Nair",
      email: "deepa@example.com",
      isEsiMember: true,
    };
    const salary = {
      basicSalary: 11000,
      allowances: [
        { name: "HRA", amount: 5000 },
        { name: "Conveyance", amount: 2000 },
        { name: "Special Allowance", amount: 2000 },
      ],
      grossSalary: 20000,
    };

    const result = computeEmployeePayrollItem(emp, salary, [], undefined, defaultCtx);
    const esiEmployee = result.statutoryDeductions.find((d) => d.name.startsWith("ESI"))?.amount;
    const esiEmployer = result.employerContributions.find((c) => c.name.startsWith("Employer ESI"))?.amount;

    // ESI wages = 11000 + 2000 = 13,000 (HRA & Conveyance completely excluded)
    // Employee ESI: ceil(13000 * 0.0075) = 98
    expect(esiEmployee).toBe(98);
    // Employer ESI: ceil(13000 * 0.0325) = 423
    expect(esiEmployer).toBe(423);
  });

  // 5. PF Member Yes/No behavior
  test("5. PF Member Yes/No toggle controls PF calculation", () => {
    const empNoPf: EmployeeInput = {
      _id: "emp_no_pf" as any,
      firstName: "Pooja",
      lastName: "Patel",
      email: "pooja@example.com",
      isPfMember: false,
    };
    const salary = {
      basicSalary: 20000,
      allowances: [],
      grossSalary: 20000,
    };

    const resultNo = computeEmployeePayrollItem(empNoPf, salary, [], undefined, defaultCtx);
    const pfDedNo = resultNo.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    const epfEmployerNo = resultNo.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    expect(pfDedNo).toBe(0);
    expect(epfEmployerNo).toBe(0);

    const empYesPf: EmployeeInput = {
      ...empNoPf,
      isPfMember: true,
    };
    const resultYes = computeEmployeePayrollItem(empYesPf, salary, [], undefined, defaultCtx);
    const pfDedYes = resultYes.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    expect(pfDedYes).toBe(2400); // 12% of 20000
  });

  // 6. EPS and employer contribution allocation
  test("6. EPS caps at ₹1,250 and remainder allocates to Employer EPF", () => {
    const emp: EmployeeInput = {
      _id: "emp_6" as any,
      firstName: "Kiran",
      lastName: "Das",
      email: "kiran@example.com",
      isPfMember: true,
    };
    const salary = {
      basicSalary: 20000,
      allowances: [],
      grossSalary: 20000,
    };

    const result = computeEmployeePayrollItem(emp, salary, [], undefined, defaultCtx);
    const epfEmployer = result.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    const epsEmployer = result.employerContributions.find((c) => c.name.startsWith("Employer EPS"))?.amount;

    // Total 12% = 2,400
    // EPS 8.33% on min(20000, 15000) = 1,250
    expect(epsEmployer).toBe(1250);
    // EPF = 2400 - 1250 = 1150
    expect(epfEmployer).toBe(1150);
    expect((epfEmployer ?? 0) + (epsEmployer ?? 0)).toBe(2400);
  });

  // 7. ESI eligibility boundaries and contribution-period rules
  test("7. ESI threshold boundary (₹21,000) and Sec 2(9) mid-period coverage continuation", () => {
    const empAt: EmployeeInput = {
      _id: "emp_at" as any,
      firstName: "A",
      lastName: "B",
      email: "ab@example.com",
    };
    const salAt = { basicSalary: 15000, allowances: [{ name: "Special Allowance", amount: 6000 }], grossSalary: 21000 };
    const resAt = computeEmployeePayrollItem(empAt, salAt, [], undefined, defaultCtx);
    expect(resAt.statutoryDeductions.find((d) => d.name.startsWith("ESI"))?.amount).toBeGreaterThan(0);

    // Above ceiling without period coverage -> exempt
    const salAbove = { basicSalary: 16000, allowances: [{ name: "Special Allowance", amount: 6000 }], grossSalary: 22000 };
    const resAbove = computeEmployeePayrollItem(empAt, salAbove, [], undefined, defaultCtx);
    expect(resAbove.statutoryDeductions.find((d) => d.name.startsWith("ESI"))?.amount).toBe(0);

    // Above ceiling WITH period coverage -> covered under Sec 2(9) proviso
    const resCovered = computeEmployeePayrollItem(
      empAt,
      salAbove,
      [],
      { esiContributionPeriodCovered: true },
      defaultCtx,
    );
    expect(resCovered.statutoryDeductions.find((d) => d.name.startsWith("ESI"))?.amount).toBeGreaterThan(0);
    expect(resCovered.warnings.some((w) => w.includes("Section 2(9)"))).toBe(true);
  });

  // 8. Loss-of-pay (LOP) proration
  test("8. Loss of Pay prorates both PF and ESI wage bases proportionally", () => {
    const emp: EmployeeInput = {
      _id: "emp_8" as any,
      firstName: "Pawan",
      lastName: "K",
      email: "pawan@example.com",
      isPfMember: true,
      isEsiMember: true,
    };
    const salary = {
      basicSalary: 15000,
      allowances: [{ name: "Special Allowance", amount: 5000 }],
      grossSalary: 20000,
    };
    // 6 absent days out of 30 days month (24 days worked)
    const attendance = [
      { status: "absent" },
      { status: "absent" },
      { status: "absent" },
      { status: "absent" },
      { status: "absent" },
      { status: "absent" },
    ];

    const result = computeEmployeePayrollItem(emp, salary, attendance, undefined, defaultCtx);
    // ESI wages unprorated: 20,000 -> prorated: 20,000 * 24/30 = 16,000
    // Employee ESI: ceil(16000 * 0.0075) = 120
    const esiEmployee = result.statutoryDeductions.find((d) => d.name.startsWith("ESI"))?.amount;
    expect(esiEmployee).toBe(120);

    // PF Wage base unprorated for ESI-compliant: 15000 + 5000 = 20,000 -> prorated: 20,000 * 24/30 = 16,000
    // Employee PF: 16000 * 0.12 = 1,920
    const pfDed = result.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    expect(pfDed).toBe(1920);
  });

  // 9. Zero, negative, missing, and fractional wage components
  test("9. Edge cases: zero, missing, negative, and fractional values calculate cleanly", () => {
    const emp: EmployeeInput = {
      _id: "emp_edge" as any,
      firstName: "Edge",
      lastName: "Case",
      email: "edge@example.com",
    };

    // Missing salary
    const missingRes = computeEmployeePayrollItem(emp, undefined, [], undefined, defaultCtx);
    expect(missingRes.grossSalary).toBe(0);
    expect(missingRes.netSalary).toBe(0);
    expect(missingRes.warnings.length).toBeGreaterThan(0);

    // Negative values clamp to 0
    const negSal = { basicSalary: -5000, allowances: [], grossSalary: -5000 };
    const negRes = computeEmployeePayrollItem(emp, negSal, [], undefined, defaultCtx);
    expect(negRes.grossSalary).toBe(0);
    expect(negRes.netSalary).toBe(0);

    // Fractional values round properly
    const fracSal = {
      basicSalary: 12345.67,
      allowances: [{ name: "Special Allowance", amount: 4321.89 }],
      grossSalary: 16667.56,
    };
    const fracRes = computeEmployeePayrollItem(emp, fracSal, [], undefined, defaultCtx);
    expect(Number.isInteger(fracRes.netSalary)).toBe(true);
    expect(Number.isInteger(fracRes.totalStatutoryDeductions)).toBe(true);
  });

  // 10. Payslip, payroll totals, PF ECR, and ESI report consistency
  test("10. Employer contributions remain informational and excluded from employee net pay deductions", () => {
    const emp: EmployeeInput = {
      _id: "emp_10" as any,
      firstName: "Test",
      lastName: "Consistency",
      email: "tc@example.com",
      isPfMember: true,
      isEsiMember: true,
    };
    const salary = {
      basicSalary: 14000,
      allowances: [{ name: "Special Allowance", amount: 4000 }],
      grossSalary: 18000,
    };

    const result = computeEmployeePayrollItem(emp, salary, [], undefined, defaultCtx);
    
    // Net salary must equal grossSalary - (lopDeduction + totalCustomDeductions + totalStatutoryDeductions)
    expect(result.netSalary).toBe(
      result.grossSalary - (result.lopDeduction + result.totalCustomDeductions + result.totalStatutoryDeductions),
    );

    // Employer contributions must NOT be subtracted from net salary
    expect(result.totalEmployerContributions).toBeGreaterThan(0);
    expect(result.netSalary + result.totalDeductions).toBe(result.grossSalary);
  });
});
