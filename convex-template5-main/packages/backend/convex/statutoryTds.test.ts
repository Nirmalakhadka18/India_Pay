import { describe, expect, test } from "vitest";
import { calculateAnnualTds } from "./statutoryTds";

describe("Statutory TDS Engine — New Tax Regime (Section 115BAC)", () => {
  test("Gross income under standard deduction threshold (₹75,000) produces zero tax", () => {
    const res = calculateAnnualTds({
      currentMonthlyGross: 5000,
      remainingPayrollMonths: 12,
      taxRegime: "new",
    });
    expect(res.annualGrossSalary).toBe(60000);
    expect(res.standardDeduction).toBe(60000); // Capped at gross
    expect(res.netTaxableIncome).toBe(0);
    expect(res.totalAnnualTaxLiability).toBe(0);
    expect(res.estimatedMonthlyTds).toBe(0);
  });

  test("Gross income up to ₹7,75,000 produces ₹0 net tax after Standard Deduction (₹75k) and Section 87A Rebate", () => {
    // Annual Gross ₹7,75,000 - ₹75,000 Standard Deduction = ₹7,00,000 Net Taxable Income
    const res = calculateAnnualTds({
      currentMonthlyGross: 775000 / 12,
      remainingPayrollMonths: 12,
      taxRegime: "new",
    });
    expect(res.standardDeduction).toBe(75000);
    expect(res.netTaxableIncome).toBe(700000);
    // Slab tax on ₹7,00,000: (₹3,00,001 to ₹7,00,000 @ 5%) = ₹20,000
    expect(res.grossTaxBeforeRebate).toBe(20000);
    // Section 87A rebate wipes out the full ₹20,000
    expect(res.rebateSection87A).toBe(20000);
    expect(res.netTaxAfterRebate).toBe(0);
    expect(res.totalAnnualTaxLiability).toBe(0);
    expect(res.estimatedMonthlyTds).toBe(0);
  });

  test("Marginal relief under Section 87A for income marginally above ₹7,00,000", () => {
    // Annual Taxable ₹7,10,000 (Excess over ₹7,00,000 is ₹10,000)
    // Slabs: ₹20,000 (5% of 4L) + ₹1,000 (10% of 10k) = ₹21,000 gross tax
    // Marginal relief ensures tax payable does not exceed excess income (₹10,000)
    const res = calculateAnnualTds({
      currentMonthlyGross: (710000 + 75000) / 12,
      remainingPayrollMonths: 12,
      taxRegime: "new",
    });
    expect(res.netTaxableIncome).toBe(710000);
    expect(res.grossTaxBeforeRebate).toBe(21000);
    expect(res.rebateSection87A).toBe(11000); // 21000 - 10000 = 11000 relief
    expect(res.netTaxAfterRebate).toBe(10000);
  });

  test("Middle income bracket (₹12,00,000 Gross) calculation with 4% Cess and monthly withholding", () => {
    // Gross: ₹12,00,000 -> Standard Deduction ₹75,000 -> Taxable: ₹11,25,000
    // Slabs:
    // 0 - 3L: 0
    // 3L - 7L: 400000 * 5% = 20,000
    // 7L - 10L: 300000 * 10% = 30,000
    // 10L - 11.25L: 125000 * 15% = 18,750
    // Gross tax = 20000 + 30000 + 18750 = 68,750
    // Cess @ 4% = 2,750
    // Total annual tax = 71,500
    // Monthly TDS = 71500 / 12 = 5,958
    const res = calculateAnnualTds({
      currentMonthlyGross: 100000,
      remainingPayrollMonths: 12,
      taxRegime: "new",
    });
    expect(res.annualGrossSalary).toBe(1200000);
    expect(res.standardDeduction).toBe(75000);
    expect(res.netTaxableIncome).toBe(1125000);
    expect(res.grossTaxBeforeRebate).toBe(68750);
    expect(res.cess).toBe(2750);
    expect(res.totalAnnualTaxLiability).toBe(71500);
    expect(res.estimatedMonthlyTds).toBe(5958);
  });

  test("Chapter VI-A declarations are not applied in New Regime", () => {
    const res = calculateAnnualTds({
      currentMonthlyGross: 100000,
      remainingPayrollMonths: 12,
      taxRegime: "new",
      declarations: {
        section80C: 150000,
        section80D: 25000,
      },
    });
    // Standard deduction is ₹75,000, declarations ignored
    expect(res.totalExemptionsAndDeductions).toBe(75000);
    expect(res.netTaxableIncome).toBe(1125000);
  });

  test("High net worth income (> ₹50 Lakhs) incurs statutory surcharge", () => {
    const res = calculateAnnualTds({
      currentMonthlyGross: 500000, // ₹60,00,000 / year
      remainingPayrollMonths: 12,
      taxRegime: "new",
    });
    expect(res.annualGrossSalary).toBe(6000000);
    expect(res.surcharge).toBeGreaterThan(0);
    // Surcharge for > 50L up to 1Cr is 10% of tax
    expect(res.surcharge).toBe(Math.round(res.netTaxAfterRebate * 0.1));
  });

  test("Marginal relief applies when income marginally exceeds ₹50 Lakhs surcharge threshold", () => {
    // Gross: ₹50,85,000 -> Standard Deduction ₹75,000 -> Net Taxable: ₹50,10,000 (Excess = ₹10,000)
    const res = calculateAnnualTds({
      currentMonthlyGross: (5010000 + 75000) / 12,
      remainingPayrollMonths: 12,
      taxRegime: "new",
    });
    expect(res.netTaxableIncome).toBe(5010000);
    // Tax at 50L is 11,90,000. Maximum allowed tax + surcharge = 11,90,000 + 10,000 = 12,00,000.
    const taxPlusSurcharge = res.netTaxAfterRebate + res.surcharge;
    expect(taxPlusSurcharge).toBe(1200000);
  });
});

describe("Statutory TDS Engine — Old Tax Regime", () => {
  test("Standard deduction of ₹50,000 applied in Old Regime", () => {
    const res = calculateAnnualTds({
      currentMonthlyGross: 40000, // ₹4,80,000 / year
      remainingPayrollMonths: 12,
      taxRegime: "old",
    });
    expect(res.standardDeduction).toBe(50000);
    expect(res.netTaxableIncome).toBe(430000);
    // Under ₹5,00,000 net taxable in Old Regime gets full 87A rebate
    expect(res.rebateSection87A).toBe(res.grossTaxBeforeRebate);
    expect(res.totalAnnualTaxLiability).toBe(0);
    expect(res.estimatedMonthlyTds).toBe(0);
  });

  test("Section 80C declaration is capped at statutory ₹1,50,000", () => {
    const res = calculateAnnualTds({
      currentMonthlyGross: 100000, // ₹12,00,000 / year
      remainingPayrollMonths: 12,
      taxRegime: "old",
      declarations: {
        section80C: 250000, // Exceeds statutory cap of 150000
        section80D: 25000,
      },
    });
    // Standard Deduction (50,000) + 80C (150,000) + 80D (25,000) = 225,000
    expect(res.totalExemptionsAndDeductions).toBe(225000);
    expect(res.netTaxableIncome).toBe(1200000 - 225000);
  });
});

describe("Statutory TDS Engine — YTD Deductions & Boundary Conditions", () => {
  test("YTD TDS already deducted offsets remaining annual liability", () => {
    // Total annual tax = 71,500. Suppose 50,000 was already deducted in past 6 months.
    // Remaining tax = 21,500 over remaining 6 months -> Math.round(21500 / 6) = 3583
    const res = calculateAnnualTds({
      currentMonthlyGross: 100000,
      ytdGrossSalary: 600000,
      ytdTdsDeducted: 50000,
      remainingPayrollMonths: 6,
      taxRegime: "new",
    });
    expect(res.totalAnnualTaxLiability).toBe(71500);
    expect(res.ytdTdsAlreadyDeducted).toBe(50000);
    expect(res.remainingTaxToDeduct).toBe(21500);
    expect(res.estimatedMonthlyTds).toBe(3583);
  });

  test("Zero monthly TDS when YTD TDS already satisfies annual tax", () => {
    const res = calculateAnnualTds({
      currentMonthlyGross: 100000,
      ytdGrossSalary: 600000,
      ytdTdsDeducted: 80000, // Over-deducted
      remainingPayrollMonths: 6,
      taxRegime: "new",
    });
    expect(res.remainingTaxToDeduct).toBe(0);
    expect(res.estimatedMonthlyTds).toBe(0);
  });

  test("Negative values safely clamped without throwing", () => {
    const res = calculateAnnualTds({
      currentMonthlyGross: -50000,
      remainingPayrollMonths: -5,
      taxRegime: "new",
    });
    expect(res.annualGrossSalary).toBe(0);
    expect(res.netTaxableIncome).toBe(0);
    expect(res.totalAnnualTaxLiability).toBe(0);
    expect(res.estimatedMonthlyTds).toBe(0);
  });
});
