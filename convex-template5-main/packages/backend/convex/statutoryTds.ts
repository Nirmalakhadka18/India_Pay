/**
 * Statutory Income Tax TDS Calculation Engine for Indian Payroll (Section 192, Income Tax Act, 1961)
 *
 * Applicable Financial Year: FY 2026-27 (AY 2027-28)
 *
 * Regulatory References:
 * - Section 115BAC: Default New Tax Regime (Finance (No. 2) Act, 2024 revisions)
 * - Section 16(ia): Standard Deduction for salaried individuals
 * - Section 87A: Rebate on total income
 * - Section 192: Deduction of tax at source from salaries (monthly average deduction)
 * - Finance Act: Health & Education Cess @ 4%
 *
 * IMPORTANT COMPLIANCE DIRECTIVE:
 * This module provides verified statutory calculations for automated tax forecasting.
 * In accordance with release-safety guidelines, automated calculations do not replace
 * manual overrides in production payroll runs until employee declarations are validated.
 */

export type TaxRegime = "new" | "old";

export interface TdsDeclarationInput {
  // Chapter VI-A deductions (Old Regime only)
  section80C?: number; // Capped at ₹1,50,000 (EPF employee share, PPF, ELSS, LIC, etc.)
  section80D?: number; // Medical insurance (typically up to ₹25,000 / ₹50,000)
  section80CCD1B?: number; // Additional NPS (up to ₹50,000)
  otherChapterVIA?: number; // 80E, 80G, etc.
  // Section 24 (Home Loan interest, max ₹2,00,000 for self-occupied in Old Regime)
  homeLoanInterestSec24?: number;
  // HRA exemption declaration (Section 10(13A))
  hraExemption?: number;
}

export interface TdsCalculationInput {
  currentMonthlyGross: number;
  // Year-to-Date numbers for the current Financial Year (April to March)
  ytdGrossSalary?: number;
  ytdTdsDeducted?: number;
  remainingPayrollMonths: number; // Number of months left in FY, including current month (1 to 12)
  taxRegime: TaxRegime;
  declarations?: TdsDeclarationInput;
}

export interface TaxSlabBreakdown {
  slab: string;
  rate: number;
  taxableAmountInSlab: number;
  taxAmount: number;
}

export interface TdsCalculationResult {
  taxRegime: TaxRegime;
  annualGrossSalary: number;
  standardDeduction: number;
  totalExemptionsAndDeductions: number;
  netTaxableIncome: number;
  slabBreakdown: TaxSlabBreakdown[];
  grossTaxBeforeRebate: number;
  rebateSection87A: number;
  netTaxAfterRebate: number;
  surcharge: number;
  cess: number; // 4% Health & Education Cess
  totalAnnualTaxLiability: number;
  ytdTdsAlreadyDeducted: number;
  remainingTaxToDeduct: number;
  estimatedMonthlyTds: number;
  isAdvisoryOnly: boolean;
  notes: string[];
}

/**
 * Compute New Tax Regime (Section 115BAC) slabs for FY 2026-27:
 * - Standard Deduction: ₹75,000
 * - Slabs:
 *   - ₹0 - ₹3,00,000: 0%
 *   - ₹3,00,001 - ₹7,00,000: 5%
 *   - ₹7,00,001 - ₹10,00,000: 10%
 *   - ₹10,00,001 - ₹12,00,000: 15%
 *   - ₹12,00,001 - ₹15,00,000: 20%
 *   - Above ₹15,00,000: 30%
 * - Section 87A: Rebate of 100% of tax if taxable income <= ₹7,00,000 (tax becomes ₹0)
 * - Marginal relief: if income marginally > ₹7,00,000, tax cannot exceed income - ₹7,00,000
 */
function calculateNewRegimeTax(taxableIncome: number): {
  slabs: TaxSlabBreakdown[];
  grossTax: number;
  rebate87A: number;
  taxAfterRebate: number;
} {
  const slabs: TaxSlabBreakdown[] = [];
  let grossTax = 0;

  const brackets = [
    { label: "₹0 to ₹3,00,000", limit: 300000, rate: 0.0 },
    { label: "₹3,00,001 to ₹7,00,000", limit: 400000, rate: 0.05 },
    { label: "₹7,00,001 to ₹10,00,000", limit: 300000, rate: 0.1 },
    { label: "₹10,00,001 to ₹12,00,000", limit: 200000, rate: 0.15 },
    { label: "₹12,00,001 to ₹15,00,000", limit: 300000, rate: 0.2 },
    { label: "Above ₹15,00,000", limit: Number.POSITIVE_INFINITY, rate: 0.3 },
  ];

  let remainingIncome = taxableIncome;

  for (const b of brackets) {
    if (remainingIncome <= 0) {
      slabs.push({
        slab: b.label,
        rate: b.rate,
        taxableAmountInSlab: 0,
        taxAmount: 0,
      });
      continue;
    }
    const taxableInBracket = Math.min(remainingIncome, b.limit);
    const taxInBracket = Math.round(taxableInBracket * b.rate);
    grossTax += taxInBracket;
    remainingIncome -= taxableInBracket;

    slabs.push({
      slab: b.label,
      rate: b.rate,
      taxableAmountInSlab: taxableInBracket,
      taxAmount: taxInBracket,
    });
  }

  // Section 87A Rebate for New Regime:
  // If taxable income <= ₹7,00,000, full rebate up to ₹25,000
  let rebate87A = 0;
  if (taxableIncome <= 700000) {
    rebate87A = grossTax;
  } else if (taxableIncome > 700000 && taxableIncome <= 727777) {
    // Marginal relief under Section 87A: Tax cannot exceed excess of income over ₹7,00,000
    const excessIncome = taxableIncome - 700000;
    if (grossTax > excessIncome) {
      rebate87A = grossTax - excessIncome;
    }
  }

  const taxAfterRebate = Math.max(0, grossTax - rebate87A);

  return { slabs, grossTax, rebate87A, taxAfterRebate };
}

/**
 * Compute Old Tax Regime slabs:
 * - Standard Deduction: ₹50,000
 * - Slabs:
 *   - ₹0 - ₹2,50,000: 0%
 *   - ₹2,50,001 - ₹5,00,000: 5%
 *   - ₹5,00,001 - ₹10,00,000: 20%
 *   - Above ₹10,00,000: 30%
 * - Section 87A: Rebate of 100% of tax if taxable income <= ₹5,00,000 (tax becomes ₹0)
 */
function calculateOldRegimeTax(taxableIncome: number): {
  slabs: TaxSlabBreakdown[];
  grossTax: number;
  rebate87A: number;
  taxAfterRebate: number;
} {
  const slabs: TaxSlabBreakdown[] = [];
  let grossTax = 0;

  const brackets = [
    { label: "₹0 to ₹2,50,000", limit: 250000, rate: 0.0 },
    { label: "₹2,50,001 to ₹5,00,000", limit: 250000, rate: 0.05 },
    { label: "₹5,00,001 to ₹10,00,000", limit: 500000, rate: 0.2 },
    { label: "Above ₹10,00,000", limit: Number.POSITIVE_INFINITY, rate: 0.3 },
  ];

  let remainingIncome = taxableIncome;

  for (const b of brackets) {
    if (remainingIncome <= 0) {
      slabs.push({
        slab: b.label,
        rate: b.rate,
        taxableAmountInSlab: 0,
        taxAmount: 0,
      });
      continue;
    }
    const taxableInBracket = Math.min(remainingIncome, b.limit);
    const taxInBracket = Math.round(taxableInBracket * b.rate);
    grossTax += taxInBracket;
    remainingIncome -= taxableInBracket;

    slabs.push({
      slab: b.label,
      rate: b.rate,
      taxableAmountInSlab: taxableInBracket,
      taxAmount: taxInBracket,
    });
  }

  // Section 87A Rebate for Old Regime:
  // If taxable income <= ₹5,00,000, full rebate up to ₹12,500
  let rebate87A = 0;
  if (taxableIncome <= 500000) {
    rebate87A = grossTax;
  }

  const taxAfterRebate = Math.max(0, grossTax - rebate87A);

  return { slabs, grossTax, rebate87A, taxAfterRebate };
}

function calculateTaxBeforeSurcharge(
  taxableIncome: number,
  regime: TaxRegime,
): number {
  if (regime === "new") {
    return calculateNewRegimeTax(taxableIncome).taxAfterRebate;
  }
  return calculateOldRegimeTax(taxableIncome).taxAfterRebate;
}

/**
 * Calculate Surcharge on high net worth individuals with statutory Marginal Relief.
 *
 * Statutory Marginal Relief Rules (Income-tax Act):
 * 1. Income > ₹50,00,000 up to ₹1,00,00,000 (10% nominal rate):
 *    Tax + Surcharge <= Tax(₹50L) + (Income - ₹50L)
 * 2. Income > ₹1,00,00,000 up to ₹2,00,00,000 (15% nominal rate):
 *    Tax + Surcharge <= [Tax(₹1Cr) + Surcharge(₹1Cr @ 10%)] + (Income - ₹1Cr)
 * 3. Income > ₹2,00,00,000 up to ₹5,00,00,000 (25% nominal rate):
 *    Tax + Surcharge <= [Tax(₹2Cr) + Surcharge(₹2Cr @ 15%)] + (Income - ₹2Cr)
 * 4. Income > ₹5,00,00,000 (New Regime capped at 25%; Old Regime 37%):
 *    Tax + Surcharge <= [Tax(₹5Cr) + Surcharge(₹5Cr @ 25%)] + (Income - ₹5Cr)
 */
function calculateSurcharge(
  taxableIncome: number,
  taxAfterRebate: number,
  regime: TaxRegime,
): number {
  if (taxAfterRebate <= 0 || taxableIncome <= 5000000) return 0;

  let nominalRate = 0;
  let threshold = 0;
  let baseTaxAndSurcharge = 0;

  if (taxableIncome > 5000000 && taxableIncome <= 10000000) {
    nominalRate = 0.1;
    threshold = 5000000;
    baseTaxAndSurcharge = calculateTaxBeforeSurcharge(5000000, regime);
  } else if (taxableIncome > 10000000 && taxableIncome <= 20000000) {
    nominalRate = 0.15;
    threshold = 10000000;
    const taxAt1Cr = calculateTaxBeforeSurcharge(10000000, regime);
    baseTaxAndSurcharge = taxAt1Cr + Math.round(taxAt1Cr * 0.1);
  } else if (taxableIncome > 20000000 && taxableIncome <= 50000000) {
    nominalRate = 0.25;
    threshold = 20000000;
    const taxAt2Cr = calculateTaxBeforeSurcharge(20000000, regime);
    baseTaxAndSurcharge = taxAt2Cr + Math.round(taxAt2Cr * 0.15);
  } else if (taxableIncome > 50000000) {
    // Under Section 115BAC New Regime, max surcharge is capped at 25% by Finance Act 2023 onwards
    nominalRate = regime === "new" ? 0.25 : 0.37;
    threshold = 50000000;
    const taxAt5Cr = calculateTaxBeforeSurcharge(50000000, regime);
    baseTaxAndSurcharge = taxAt5Cr + Math.round(taxAt5Cr * 0.25);
  }

  const nominalSurcharge = Math.round(taxAfterRebate * nominalRate);
  const totalTaxAndSurcharge = taxAfterRebate + nominalSurcharge;

  const excessIncome = taxableIncome - threshold;
  const maxAllowableTaxAndSurcharge = baseTaxAndSurcharge + excessIncome;

  if (totalTaxAndSurcharge > maxAllowableTaxAndSurcharge) {
    const relief = totalTaxAndSurcharge - maxAllowableTaxAndSurcharge;
    return Math.max(0, nominalSurcharge - relief);
  }

  return nominalSurcharge;
}

/**
 * Main TDS Calculation function under Section 192
 */
export function calculateAnnualTds(
  input: TdsCalculationInput,
): TdsCalculationResult {
  const notes: string[] = [];
  const currentMonthly = Math.max(0, input.currentMonthlyGross);
  const remainingMonths = Math.max(
    1,
    Math.min(12, input.remainingPayrollMonths),
  );
  const ytdGross = Math.max(0, input.ytdGrossSalary ?? 0);
  const ytdTds = Math.max(0, input.ytdTdsDeducted ?? 0);

  // Annualized Gross Salary = Actual YTD Gross + (Current Monthly Gross * Remaining Months)
  const annualGrossSalary = ytdGross + currentMonthly * remainingMonths;

  let standardDeduction = 0;
  let totalExemptionsAndDeductions = 0;

  if (input.taxRegime === "new") {
    // FY 2026-27 New Regime Standard Deduction under Section 16(ia) is ₹75,000
    standardDeduction = Math.min(annualGrossSalary, 75000);
    // Chapter VI-A deductions are NOT permitted under Section 115BAC (except employer NPS 80CCD(2))
    totalExemptionsAndDeductions = standardDeduction;
    notes.push(
      "New Tax Regime (Section 115BAC): Standard deduction ₹75,000 applied. Chapter VI-A deductions not applicable.",
    );
  } else {
    // Old Regime Standard Deduction is ₹50,000
    standardDeduction = Math.min(annualGrossSalary, 50000);

    const decl = input.declarations ?? {};
    // Section 80C capped at ₹1,50,000
    const sec80C = Math.min(150000, Math.max(0, decl.section80C ?? 0));
    const sec80D = Math.min(50000, Math.max(0, decl.section80D ?? 0));
    const sec80CCD1B = Math.min(50000, Math.max(0, decl.section80CCD1B ?? 0));
    const otherChapterVIA = Math.max(0, decl.otherChapterVIA ?? 0);
    const sec24 = Math.min(
      200000,
      Math.max(0, decl.homeLoanInterestSec24 ?? 0),
    );
    const hraExempt = Math.max(0, decl.hraExemption ?? 0);

    const totalDeclaredDeductions =
      sec80C + sec80D + sec80CCD1B + otherChapterVIA + sec24 + hraExempt;
    totalExemptionsAndDeductions = standardDeduction + totalDeclaredDeductions;
    notes.push(
      `Old Tax Regime: Standard deduction ₹50,000 + declared deductions ₹${totalDeclaredDeductions.toLocaleString("en-IN")} applied.`,
    );
  }

  const netTaxableIncome = Math.max(
    0,
    annualGrossSalary - totalExemptionsAndDeductions,
  );

  // Round taxable income to nearest ₹10 as per Section 288A
  const roundedTaxableIncome = Math.round(netTaxableIncome / 10) * 10;

  let slabResult: {
    slabs: TaxSlabBreakdown[];
    grossTax: number;
    rebate87A: number;
    taxAfterRebate: number;
  };

  if (input.taxRegime === "new") {
    slabResult = calculateNewRegimeTax(roundedTaxableIncome);
  } else {
    slabResult = calculateOldRegimeTax(roundedTaxableIncome);
  }

  const surcharge = calculateSurcharge(
    roundedTaxableIncome,
    slabResult.taxAfterRebate,
    input.taxRegime,
  );

  // Health & Education Cess @ 4% on (Tax + Surcharge) as per Section 115JB / Finance Act
  const taxPlusSurcharge = slabResult.taxAfterRebate + surcharge;
  const cess = Math.round(taxPlusSurcharge * 0.04);

  // Total annual tax liability, rounded to nearest ₹10 as per Section 288B
  const totalAnnualTaxLiability =
    Math.round((taxPlusSurcharge + cess) / 10) * 10;

  // Remaining tax to be deducted across remaining months
  const remainingTaxToDeduct = Math.max(0, totalAnnualTaxLiability - ytdTds);

  // Monthly TDS average under Section 192
  const estimatedMonthlyTds =
    remainingMonths > 0
      ? Math.round(remainingTaxToDeduct / remainingMonths)
      : 0;

  if (slabResult.rebate87A > 0) {
    notes.push(
      `Section 87A rebate applied: ₹${slabResult.rebate87A.toLocaleString("en-IN")}. Zero tax liability up to statutory threshold.`,
    );
  }

  return {
    taxRegime: input.taxRegime,
    annualGrossSalary,
    standardDeduction,
    totalExemptionsAndDeductions,
    netTaxableIncome: roundedTaxableIncome,
    slabBreakdown: slabResult.slabs,
    grossTaxBeforeRebate: slabResult.grossTax,
    rebateSection87A: slabResult.rebate87A,
    netTaxAfterRebate: slabResult.taxAfterRebate,
    surcharge,
    cess,
    totalAnnualTaxLiability,
    ytdTdsAlreadyDeducted: ytdTds,
    remainingTaxToDeduct,
    estimatedMonthlyTds,
    isAdvisoryOnly: true,
    notes,
  };
}
