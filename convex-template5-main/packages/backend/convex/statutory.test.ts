import { describe, expect, test } from "vitest";
import { computeEmployeePayrollItem, type CalculationContext } from "./statutory";

const baseEmp = {
  _id: "emp_123" as any,
  firstName: "Arun",
  lastName: "Kumar",
  email: "arun@example.com",
  department: "Engineering",
};

const defaultCalcCtx: CalculationContext = {
  totalDaysInMonth: 30,
  month: 4, // April
  lopSettings: {
    calculationBasis: "calendar_days",
    includeUnpaidLeave: true,
    includeAbsent: true,
    halfDayFactor: 0.5,
  },
  workspaceCompliance: {
    epfEnabled: true,
    epfWageCeiling: 15000,
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

describe("Statutory EPF Calculation", () => {
  test("Basic salary below statutory ceiling (₹10,000)", () => {
    const salary = {
      _id: "sal_1" as any,
      basicSalary: 10000,
      allowances: [],
      deductions: [],
      grossSalary: 10000,
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], undefined, defaultCalcCtx);

    // Eligible wage: 10,000
    // Employee EPF: 12% = 1200
    const epfDeduction = item.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    expect(epfDeduction).toBe(1200);

    // Employer breakdown:
    // EPS: 8.33% of 10000 = 833
    // EPF: 1200 - 833 = 367
    // EDLI: 0.5% = 50
    // Admin: 0.5% = 50
    const empPf = item.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    const empEps = item.employerContributions.find((c) => c.name.startsWith("Employer EPS"))?.amount;
    const edli = item.employerContributions.find((c) => c.name.startsWith("EDLI"))?.amount;
    const admin = item.employerContributions.find((c) => c.name.startsWith("EPFO Admin"))?.amount;

    expect(empPf).toBe(367);
    expect(empEps).toBe(833);
    expect(edli).toBe(50);
    expect(admin).toBe(50);
    expect(empPf! + empEps! + edli! + admin!).toBe(1300);
  });

  test("Basic salary exactly at statutory ceiling (₹15,000)", () => {
    const salary = {
      _id: "sal_2" as any,
      basicSalary: 15000,
      allowances: [],
      deductions: [],
      grossSalary: 15000,
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], undefined, defaultCalcCtx);

    const epfDeduction = item.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    expect(epfDeduction).toBe(1800);

    const empPf = item.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    const empEps = item.employerContributions.find((c) => c.name.startsWith("Employer EPS"))?.amount;
    const edli = item.employerContributions.find((c) => c.name.startsWith("EDLI"))?.amount;
    const admin = item.employerContributions.find((c) => c.name.startsWith("EPFO Admin"))?.amount;

    expect(empEps).toBe(1250); // Capped at ₹1,250
    expect(empPf).toBe(550);  // 1800 - 1250 = 550 (3.67%)
    expect(edli).toBe(75);    // 0.5% of 15000 = 75
    expect(admin).toBe(75);   // 0.5% of 15000 = 75
    expect(empPf! + empEps! + edli! + admin!).toBe(1950);
  });

  test("Basic salary above ceiling (₹35,000) restricted to statutory ₹15,000", () => {
    const salary = {
      _id: "sal_3" as any,
      basicSalary: 35000,
      allowances: [],
      deductions: [],
      grossSalary: 35000,
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], undefined, defaultCalcCtx);

    // Should cap at ₹15,000 ceiling by default
    const epfDeduction = item.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    expect(epfDeduction).toBe(1800);

    const empPf = item.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    const empEps = item.employerContributions.find((c) => c.name.startsWith("Employer EPS"))?.amount;
    expect(empEps).toBe(1250);
    expect(empPf).toBe(550);
  });

  test("Basic salary above ceiling with voluntary contribution on actual full basic (₹50,000)", () => {
    const salary = {
      _id: "sal_4" as any,
      basicSalary: 50000,
      allowances: [],
      deductions: [],
      grossSalary: 50000,
    };
    const empComp = {
      taxRegime: "new" as const,
      epfOptOut: false,
      epfOnActualBasic: true, // Voluntary full basic election
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], empComp, defaultCalcCtx);

    // Employee EPF on full 50,000 = 6,000
    const epfDeduction = item.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    expect(epfDeduction).toBe(6000);

    const empPf = item.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    const empEps = item.employerContributions.find((c) => c.name.startsWith("Employer EPS"))?.amount;
    const edli = item.employerContributions.find((c) => c.name.startsWith("EDLI"))?.amount;
    const admin = item.employerContributions.find((c) => c.name.startsWith("EPFO Admin"))?.amount;

    // EPS is still capped at ₹1,250
    expect(empEps).toBe(1250);
    // Employer EPF gets remainder: 6000 - 1250 = 4750
    expect(empPf).toBe(4750);
    // EDLI capped at 75
    expect(edli).toBe(75);
    // Admin: 0.5% of 50000 = 250
    expect(admin).toBe(250);
  });

  test("Employee opt-out under Form 11 produces zero EPF deductions", () => {
    const salary = {
      _id: "sal_5" as any,
      basicSalary: 30000,
      allowances: [],
      deductions: [],
      grossSalary: 30000,
    };
    const empComp = {
      taxRegime: "new" as const,
      epfOptOut: true,
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], empComp, defaultCalcCtx);

    const epfDeduction = item.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    const empPf = item.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    expect(epfDeduction).toBe(0);
    expect(empPf).toBe(0);
  });
});

describe("Statutory ESI Calculation", () => {
  test("Gross below statutory threshold (₹18,000 <= ₹21,000)", () => {
    const salary = {
      _id: "sal_esi_1" as any,
      basicSalary: 12000,
      allowances: [{ name: "HRA", amount: 6000 }],
      deductions: [],
      grossSalary: 18000,
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], undefined, defaultCalcCtx);

    const esiEmployee = item.statutoryDeductions.find((d) => d.name.startsWith("ESI"))?.amount;
    const esiEmployer = item.employerContributions.find((c) => c.name.startsWith("Employer ESI"))?.amount;

    // 0.75% of 18000 = 135
    expect(esiEmployee).toBe(135);
    // 3.25% of 18000 = 585
    expect(esiEmployer).toBe(585);
  });

  test("Gross exactly at statutory threshold (₹21,000)", () => {
    const salary = {
      _id: "sal_esi_2" as any,
      basicSalary: 15000,
      allowances: [{ name: "Special", amount: 6000 }],
      deductions: [],
      grossSalary: 21000,
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], undefined, defaultCalcCtx);

    const esiEmployee = item.statutoryDeductions.find((d) => d.name.startsWith("ESI"))?.amount;
    const esiEmployer = item.employerContributions.find((c) => c.name.startsWith("Employer ESI"))?.amount;

    // 0.75% of 21000 = 157.5 -> Math.ceil = 158
    expect(esiEmployee).toBe(158);
    // 3.25% of 21000 = 682.5 -> Math.ceil = 683
    expect(esiEmployer).toBe(683);
  });

  test("Gross above statutory threshold (₹25,000 > ₹21,000) is ESI exempt", () => {
    const salary = {
      _id: "sal_esi_3" as any,
      basicSalary: 20000,
      allowances: [{ name: "Special", amount: 5000 }],
      deductions: [],
      grossSalary: 25000,
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], undefined, defaultCalcCtx);

    const esiEmployee = item.statutoryDeductions.find((d) => d.name.startsWith("ESI"))?.amount;
    const esiEmployer = item.employerContributions.find((c) => c.name.startsWith("Employer ESI"))?.amount;

    expect(esiEmployee).toBe(0);
    expect(esiEmployer).toBe(0);
  });
});

describe("Zero Salary & Missing Salary Structure", () => {
  test("Missing salary structure produces warnings and ₹0 gross/net", () => {
    const item = computeEmployeePayrollItem(baseEmp, undefined, [], undefined, defaultCalcCtx);
    expect(item.hasSalaryStructure).toBe(false);
    expect(item.grossSalary).toBe(0);
    expect(item.netSalary).toBe(0);
    expect(item.warnings.length).toBeGreaterThan(0);
    expect(item.warnings[0]).toContain("Missing salary structure");
  });

  test("Zero salary structure calculates cleanly without divide-by-zero errors", () => {
    const zeroSalary = {
      _id: "sal_zero" as any,
      basicSalary: 0,
      allowances: [],
      deductions: [],
      grossSalary: 0,
    };
    const item = computeEmployeePayrollItem(baseEmp, zeroSalary, [], undefined, defaultCalcCtx);
    expect(item.hasSalaryStructure).toBe(true);
    expect(item.grossSalary).toBe(0);
    expect(item.netSalary).toBe(0);
    expect(item.lopDeduction).toBe(0);
    expect(item.totalDeductions).toBe(0);
  });
});

describe("LOP, Half-Days & February Calculations", () => {
  test("February non-leap year (28 days) daily rate and Karnataka PT (₹300)", () => {
    const febCtx: CalculationContext = {
      ...defaultCalcCtx,
      month: 2,
      totalDaysInMonth: 28,
    };
    const salary = {
      _id: "sal_feb" as any,
      basicSalary: 28000,
      allowances: [],
      deductions: [],
      grossSalary: 28000,
    };
    // 2 days absent + 1 half day = 2.5 LOP days
    const attendance: any[] = [
      { status: "absent" },
      { status: "absent" },
      { status: "half_day" },
    ];
    const item = computeEmployeePayrollItem(baseEmp, salary, attendance, undefined, febCtx);

    // Daily rate = 28000 / 28 = 1000
    // LOP = 2.5 * 1000 = 2500
    expect(item.lopDays).toBe(2.5);
    expect(item.lopDeduction).toBe(2500);

    // Karnataka PT in Feb for gross >= 25000 is ₹300
    const ptAmount = item.statutoryDeductions.find((d) => d.name.startsWith("Professional Tax"))?.amount;
    expect(ptAmount).toBe(300);
  });

  test("March (31 days) Karnataka PT is standard ₹200", () => {
    const marchCtx: CalculationContext = {
      ...defaultCalcCtx,
      month: 3,
      totalDaysInMonth: 31,
    };
    const salary = {
      _id: "sal_mar" as any,
      basicSalary: 31000,
      allowances: [],
      deductions: [],
      grossSalary: 31000,
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], undefined, marchCtx);
    const ptAmount = item.statutoryDeductions.find((d) => d.name.startsWith("Professional Tax"))?.amount;
    expect(ptAmount).toBe(200);
  });
});

describe("Manual TDS Override & Net Salary", () => {
  test("Manual TDS override reduces net salary by exact override amount", () => {
    const salary = {
      _id: "sal_tds" as any,
      basicSalary: 50000,
      allowances: [],
      deductions: [],
      grossSalary: 50000,
    };
    const empComp = {
      taxRegime: "new" as const,
      epfOptOut: false,
      tdsOverride: 4500, // Manual TDS override
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], empComp, defaultCalcCtx);

    const tdsAmount = item.statutoryDeductions.find((d) => d.name.startsWith("TDS"))?.amount;
    expect(tdsAmount).toBe(4500);

    // EPF capped: 1800. PT: 200. TDS: 4500. Total statutory = 6500.
    expect(item.totalStatutoryDeductions).toBe(6500);
    // Net = 50000 - 6500 = 43500.
    expect(item.netSalary).toBe(43500);
  });

  test("Excessive deductions clamp net salary to 0 without going negative", () => {
    const salary = {
      _id: "sal_clamp" as any,
      basicSalary: 5000,
      allowances: [],
      deductions: [{ name: "Loan Recovery", amount: 10000 }],
      grossSalary: 5000,
    };
    const empComp = {
      taxRegime: "new" as const,
      epfOptOut: false,
      tdsOverride: 2000,
    };
    const item = computeEmployeePayrollItem(baseEmp, salary, [], empComp, defaultCalcCtx);
    expect(item.netSalary).toBe(0);
  });
});

describe("Idempotence & Calculation Consistency", () => {
  test("Repeated runs produce exact identical results", () => {
    const salary = {
      _id: "sal_idem" as any,
      basicSalary: 22000,
      allowances: [{ name: "HRA", amount: 8000 }],
      deductions: [{ name: "Gym", amount: 500 }],
      grossSalary: 30000,
    };
    const attendance: any[] = [{ status: "absent" }];
    const empComp = {
      taxRegime: "new" as const,
      epfOptOut: false,
      tdsOverride: 1200,
    };

    const run1 = computeEmployeePayrollItem(baseEmp, salary, attendance, empComp, defaultCalcCtx);
    const run2 = computeEmployeePayrollItem(baseEmp, salary, attendance, empComp, defaultCalcCtx);

    expect(run1).toEqual(run2);
    expect(run1.netSalary).toBe(run2.netSalary);
    expect(run1.totalEmployerContributions).toBe(run2.totalEmployerContributions);
  });
});
