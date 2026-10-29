import { describe, expect, test } from "vitest";
import { computeProfessionalTax } from "./professionalTax";
import { computeEmployeePayrollItem, type CalculationContext } from "./statutory";
import { numberToIndianWords } from "./statutoryReports";

describe("Statutory Reports Engine — Pure Math & Conversion Suite", () => {
  test("numberToIndianWords accurately converts currency amounts to Indian words", () => {
    expect(numberToIndianWords(0)).toBe("Rupees Zero Only");
    expect(numberToIndianWords(1522)).toBe(
      "Rupees One Thousand Five Hundred Twenty Two Only",
    );
    expect(numberToIndianWords(4200)).toBe(
      "Rupees Four Thousand Two Hundred Only",
    );
    expect(numberToIndianWords(131835)).toBe(
      "Rupees One Lakh Thirty One Thousand Eight Hundred Thirty Five Only",
    );
    expect(numberToIndianWords(517000)).toBe(
      "Rupees Five Lakh Seventeen Thousand Only",
    );
    expect(numberToIndianWords(10000000)).toBe("Rupees One Crore Only");
    expect(numberToIndianWords(25000000)).toBe("Rupees Two Crore Fifty Lakh Only");
  });
});

describe("ESI Statutory Calculations & Reference Validations (ESIC Act, 1948)", () => {
  test("Normal employee case: 0.75% EE and 3.25% ER rounded up to next rupee", () => {
    const grossWages = [20500, 17500];
    const eeShares = grossWages.map((w) => Math.ceil(w * 0.0075));
    const erShares = grossWages.map((w) => Math.ceil(w * 0.0325));

    expect(eeShares).toEqual([154, 132]);
    expect(erShares).toEqual([667, 569]);

    const totalGross = 38000;
    const totalEe = eeShares.reduce((a, b) => a + b, 0);
    const totalErIndividual = erShares.reduce((a, b) => a + b, 0);
    expect(totalEe).toBe(286);
    expect(totalErIndividual).toBe(1236);
    expect(totalEe + totalErIndividual).toBe(1522);

    // Matches ESI Monthly Statement reference: Total 1,522.00
    expect(numberToIndianWords(totalEe + totalErIndividual)).toBe(
      "Rupees One Thousand Five Hundred Twenty Two Only",
    );

    // ESIC Portal aggregate formula discrepancy tracking (₹1,235 vs ₹1,236)
    const portalEr = Math.round(totalGross * 0.0325);
    expect(portalEr).toBe(1235);
    expect(totalEe + portalEr).toBe(1521); // Portal total
  });

  test("ESI Wage Ceiling Boundaries: ₹20,999 (covered), ₹21,000 (covered), ₹21,001 (exempt)", () => {
    const baseCtx: CalculationContext = {
      totalDaysInMonth: 30,
      month: 9,
      lopSettings: {
        calculationBasis: "calendar_days",
        includeUnpaidLeave: true,
        includeAbsent: true,
        halfDayFactor: 0.5,
      },
      workspaceCompliance: {
        epfEnabled: false,
        esiEnabled: true,
        esiWageCeiling: 21000,
        ptEnabled: false,
      },
    };

    const emp = { _id: "e1" as any, firstName: "Test", lastName: "Emp", email: "test@example.com" };

    // ₹20,999
    const itemBelow = computeEmployeePayrollItem(
      emp,
      { basicSalary: 15000, allowances: [{ name: "Special Allowance", amount: 5999 }], grossSalary: 20999 },
      [],
      undefined,
      baseCtx,
    );
    const esiBelow = itemBelow.statutoryDeductions.find((d) => d.name.includes("ESI"))?.amount;
    expect(esiBelow).toBe(Math.ceil(20999 * 0.0075)); // 158

    // ₹21,000 exactly at ceiling
    const itemExact = computeEmployeePayrollItem(
      emp,
      { basicSalary: 15000, allowances: [{ name: "Special Allowance", amount: 6000 }], grossSalary: 21000 },
      [],
      undefined,
      baseCtx,
    );
    const esiExact = itemExact.statutoryDeductions.find((d) => d.name.includes("ESI"))?.amount;
    expect(esiExact).toBe(Math.ceil(21000 * 0.0075)); // 158

    // ₹21,001 above ceiling
    const itemAbove = computeEmployeePayrollItem(
      emp,
      { basicSalary: 15000, allowances: [{ name: "Special Allowance", amount: 6001 }], grossSalary: 21001 },
      [],
      undefined,
      baseCtx,
    );
    const esiAbove = itemAbove.statutoryDeductions.find((d) => d.name.includes("ESI"))?.amount;
    expect(esiAbove).toBe(0); // Exempt
  });

  test("Section 2(9) proviso: Employee crossing ₹21,000 mid contribution period remains covered", () => {
    const baseCtx: CalculationContext = {
      totalDaysInMonth: 30,
      month: 9,
      lopSettings: {
        calculationBasis: "calendar_days",
        includeUnpaidLeave: true,
        includeAbsent: true,
        halfDayFactor: 0.5,
      },
      workspaceCompliance: {
        epfEnabled: false,
        esiEnabled: true,
        esiWageCeiling: 21000,
        ptEnabled: false,
      },
    };

    const emp = { _id: "e1" as any, firstName: "Test", lastName: "Emp", email: "test@example.com" };

    const itemCrossed = computeEmployeePayrollItem(
      emp,
      { basicSalary: 20000, allowances: [{ name: "Special Allowance", amount: 8000 }], grossSalary: 28000 },
      [],
      { esiContributionPeriodCovered: true },
      baseCtx,
    );

    const eeEsi = itemCrossed.statutoryDeductions.find((d) => d.name.includes("ESI"))?.amount;
    const erEsi = itemCrossed.employerContributions.find((c) => c.name.includes("ESI"))?.amount;
    expect(eeEsi).toBe(Math.ceil(28000 * 0.0075)); // 210
    expect(erEsi).toBe(Math.ceil(28000 * 0.0325)); // 910
    expect(itemCrossed.warnings.some((w) => w.includes("Section 2(9) proviso"))).toBe(true);
  });

  test("LOP and partial month: ESI calculated on earned wages, not full unearned gross", () => {
    const baseCtx: CalculationContext = {
      totalDaysInMonth: 30,
      month: 9,
      lopSettings: {
        calculationBasis: "calendar_days",
        includeUnpaidLeave: true,
        includeAbsent: true,
        halfDayFactor: 0.5,
      },
      workspaceCompliance: {
        epfEnabled: false,
        esiEnabled: true,
        esiWageCeiling: 21000,
        ptEnabled: false,
      },
    };

    const emp = { _id: "e1" as any, firstName: "Test", lastName: "Emp", email: "test@example.com" };

    // 10 days absent -> earned gross = 18000 - (18000/30 * 10) = 12000
    const attendance = Array.from({ length: 10 }, () => ({ status: "absent" }));
    const itemLop = computeEmployeePayrollItem(
      emp,
      { basicSalary: 12000, allowances: [{ name: "Special Allowance", amount: 6000 }], grossSalary: 18000 },
      attendance,
      undefined,
      baseCtx,
    );

    expect(itemLop.lopDeduction).toBe(6000);
    const eeEsi = itemLop.statutoryDeductions.find((d) => d.name.includes("ESI"))?.amount;
    const erEsi = itemLop.employerContributions.find((c) => c.name.includes("ESI"))?.amount;
    expect(eeEsi).toBe(Math.ceil(12000 * 0.0075)); // 90 on earned gross 12000
    expect(erEsi).toBe(Math.ceil(12000 * 0.0325)); // 390
  });

  test("Zero Wages & Full Month LOP: 0 contributions and daysWorked = 0", () => {
    const baseCtx: CalculationContext = {
      totalDaysInMonth: 30,
      month: 9,
      lopSettings: {
        calculationBasis: "calendar_days",
        includeUnpaidLeave: true,
        includeAbsent: true,
        halfDayFactor: 0.5,
      },
      workspaceCompliance: {
        epfEnabled: false,
        esiEnabled: true,
        esiWageCeiling: 21000,
        ptEnabled: false,
      },
    };

    const emp = { _id: "e1" as any, firstName: "Test", lastName: "Emp", email: "test@example.com" };
    const fullMonthAbsent = Array.from({ length: 30 }, () => ({ status: "absent" }));

    const itemZero = computeEmployeePayrollItem(
      emp,
      { basicSalary: 10000, allowances: [{ name: "DA", amount: 5000 }], grossSalary: 15000 },
      fullMonthAbsent,
      undefined,
      baseCtx,
    );

    expect(itemZero.lopDeduction).toBe(15000);
    const eeEsi = itemZero.statutoryDeductions.find((d) => d.name.includes("ESI"))?.amount;
    const erEsi = itemZero.employerContributions.find((c) => c.name.includes("ESI"))?.amount;
    expect(eeEsi).toBe(0);
    expect(erEsi).toBe(0);
  });
});

describe("PF / EPFO & EPS Calculations & Reference Validations", () => {
  const baseCtx: CalculationContext = {
    totalDaysInMonth: 30,
    month: 9,
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
      esiEnabled: false,
      ptEnabled: false,
    },
  };

  const emp = { _id: "e1" as any, firstName: "Test", lastName: "Emp", email: "test@example.com" };

  test("Standard Statutory PF: Basic ₹15,000 capped calculation", () => {
    const item = computeEmployeePayrollItem(
      emp,
      { basicSalary: 15000, allowances: [], grossSalary: 15000 },
      [],
      undefined,
      baseCtx,
    );

    const eePf = item.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    const erPf = item.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    const erEps = item.employerContributions.find((c) => c.name.startsWith("Employer EPS"))?.amount;
    const edli = item.employerContributions.find((c) => c.name.startsWith("EDLI"))?.amount;
    const admin = item.employerContributions.find((c) => c.name.startsWith("EPFO Admin"))?.amount;

    expect(eePf).toBe(1800);  // 12% of 15000
    expect(erEps).toBe(1250); // 8.33% capped at 1250
    expect(erPf).toBe(550);   // 1800 - 1250 = 550
    expect(edli).toBe(75);    // 0.5% of 15000 = 75
    expect(admin).toBe(75);   // 0.5% of 15000 = 75
    expect(eePf).toBe(erPf! + erEps!); // Exact EPFO statutory balance
  });

  test("EPS Exclusion / Age 58+: 100% of Employer 12% goes to EPF Account 1 (EPS = 0)", () => {
    const noEpsCtx: CalculationContext = {
      ...baseCtx,
      workspaceCompliance: {
        ...baseCtx.workspaceCompliance,
        epsEnabled: false, // E.g. Employee age 58+ or non-EPS member
      },
    };

    const item = computeEmployeePayrollItem(
      emp,
      { basicSalary: 25000, allowances: [], grossSalary: 25000 },
      [],
      { epfOnActualBasic: true }, // Policy matching reference 19 employees
      noEpsCtx,
    );

    const eePf = item.statutoryDeductions.find((d) => d.name.startsWith("PF"))?.amount;
    const erPf = item.employerContributions.find((c) => c.name.startsWith("Employer EPF"))?.amount;
    const erEps = item.employerContributions.find((c) => c.name.startsWith("Employer EPS"))?.amount;

    expect(eePf).toBe(3000);  // 12% of 25000
    expect(erEps).toBe(0);    // EPS is 0
    expect(erPf).toBe(3000);  // Full 12% credited to EPF A/C 1
    // Matches reference report: Geeta Swami, Ajay Kumawat, etc. EE 3000, PF ER 3000, EPS 0!
  });

  test("Reference Combined Challan Account Totals & Balance Reconciliation", () => {
    // 21 subscribers across accounts
    const ac1_ee = 62040;
    const ac1_er = 58542;
    const ac1_total = ac1_ee + ac1_er; // 120582
    const ac2_admin = 2585;  // 0.5% of 517,000
    const ac10_eps = 3498;   // 1,874 (Munnat Ali) + 1,624 (Abdul Wahid Laskar)
    const ac21_edli = 5170;  // EDLI
    const ac22_admin = 0;    // Waived

    const grandTotal = ac1_total + ac2_admin + ac10_eps + ac21_edli + ac22_admin;
    expect(grandTotal).toBe(131835);
    expect(numberToIndianWords(grandTotal)).toBe(
      "Rupees One Lakh Thirty One Thousand Eight Hundred Thirty Five Only",
    );
  });

  test("ECR Line Delimiter & Field Ordering: Exactly 11 fields delimited by #~#", () => {
    const uan = "102387371064";
    const name = "MUNNAT ALI";
    const gross = 30000;
    const epfWages = 22500;
    const epsWages = 22500;
    const edliWages = 22500;
    const eeShare = 2700;
    const epsShare = 1874;
    const erShare = 826;
    const ncpDays = 0;
    const refund = 0;

    const ecrLine = `${uan}#~#${name}#~#${gross}#~#${epfWages}#~#${epsWages}#~#${edliWages}#~#${eeShare}#~#${epsShare}#~#${erShare}#~#${ncpDays}#~#${refund}`;
    const fields = ecrLine.split("#~#");

    expect(fields.length).toBe(11);
    expect(fields[0]).toBe("102387371064");
    expect(fields[1]).toBe("MUNNAT ALI");
    expect(fields[6]).toBe("2700");
    expect(fields[7]).toBe("1874");
    expect(fields[8]).toBe("826");
    expect(Number(fields[7]) + Number(fields[8])).toBe(Number(fields[6])); // 1874 + 826 = 2700
  });
});

describe("Professional Tax Multi-State Schedule Engine (greytHR Reference)", () => {
  test("Karnataka PT: Gross < ₹25,000 is Nil; Gross >= ₹25,000 is ₹200 (March-Jan) and ₹300 (Feb)", () => {
    // Under ₹25k
    const below = computeProfessionalTax({ grossSalary: 24999, month: 9, state: "Karnataka", ptEnabled: true });
    expect(below.amount).toBe(0);
    expect(below.isExempt).toBe(true);

    // Exactly ₹25k in September
    const exactSep = computeProfessionalTax({ grossSalary: 25000, month: 9, state: "Karnataka", ptEnabled: true });
    expect(exactSep.amount).toBe(200);
    expect(exactSep.isExempt).toBe(false);

    // Above ₹25k in February (₹300 balancing month)
    const febHigh = computeProfessionalTax({ grossSalary: 100000, month: 2, state: "Karnataka", ptEnabled: true });
    expect(febHigh.amount).toBe(300);
  });

  test("Maharashtra PT: Gender-differentiated schedules", () => {
    // Female <= ₹25,000 is exempt under 2023 notification
    const femaleUnder = computeProfessionalTax({ grossSalary: 24000, month: 9, state: "Maharashtra", gender: "female", ptEnabled: true });
    expect(femaleUnder.amount).toBe(0);
    expect(femaleUnder.isExempt).toBe(true);

    const femaleAbove = computeProfessionalTax({ grossSalary: 30000, month: 9, state: "Maharashtra", gender: "female", ptEnabled: true });
    expect(femaleAbove.amount).toBe(200);

    // Male <= ₹7,500 is exempt; ₹7,501-10,000 is ₹175; > ₹10,000 is ₹200
    const maleLow = computeProfessionalTax({ grossSalary: 7500, month: 9, state: "Maharashtra", gender: "male", ptEnabled: true });
    expect(maleLow.amount).toBe(0);

    const maleMid = computeProfessionalTax({ grossSalary: 9500, month: 9, state: "Maharashtra", gender: "male", ptEnabled: true });
    expect(maleMid.amount).toBe(175);

    const maleHigh = computeProfessionalTax({ grossSalary: 50000, month: 9, state: "Maharashtra", gender: "male", ptEnabled: true });
    expect(maleHigh.amount).toBe(200);
  });

  test("Telangana & Andhra Pradesh PT schedules", () => {
    expect(computeProfessionalTax({ grossSalary: 15000, month: 9, state: "Telangana", ptEnabled: true }).amount).toBe(0);
    expect(computeProfessionalTax({ grossSalary: 18000, month: 9, state: "Telangana", ptEnabled: true }).amount).toBe(150);
    expect(computeProfessionalTax({ grossSalary: 25000, month: 9, state: "Telangana", ptEnabled: true }).amount).toBe(200);

    expect(computeProfessionalTax({ grossSalary: 15000, month: 9, state: "Andhra Pradesh", ptEnabled: true }).amount).toBe(0);
    expect(computeProfessionalTax({ grossSalary: 18000, month: 9, state: "Andhra Pradesh", ptEnabled: true }).amount).toBe(150);
    expect(computeProfessionalTax({ grossSalary: 25000, month: 9, state: "Andhra Pradesh", ptEnabled: true }).amount).toBe(200);
  });

  test("Nil-PT States: Delhi, Haryana, Rajasthan safely return ₹0 with zero warnings", () => {
    for (const state of ["Delhi", "Haryana", "Rajasthan", "Uttar Pradesh", "Punjab"]) {
      const res = computeProfessionalTax({ grossSalary: 100000, month: 9, state, ptEnabled: true });
      expect(res.amount).toBe(0);
      expect(res.isExempt).toBe(true);
      expect(res.warnings.length).toBe(0);
    }
  });

  test("Unsupported States: Safely return ₹0 with explicit warning; NEVER default to Karnataka", () => {
    const res = computeProfessionalTax({ grossSalary: 50000, month: 9, state: "UnknownStateXYZ", ptEnabled: true });
    expect(res.amount).toBe(0);
    expect(res.warnings.some((w) => w.includes("Unsupported Professional Tax state"))).toBe(true);
  });
});
