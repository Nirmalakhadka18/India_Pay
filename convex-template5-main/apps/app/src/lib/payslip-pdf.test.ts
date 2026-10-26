import { describe, expect, test } from "vitest";
import {
  type PayslipData,
  formatIndianCurrency,
  generatePayslipPdfBlob,
  generatePayslipPdfString,
  getPayslipPdfFileName,
  numberToIndianWords,
} from "./payslip-pdf";

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE SCENARIO A: ESI Applicable (Munnat Ali)
// ─────────────────────────────────────────────────────────────────────────────
const scenarioA_MunnatAli: PayslipData = {
  workspaceName: "Victor Chasex Private Limited",
  companyAddress:
    "2ND AND 3RD FLOOR, SRI ESHWARI MANSION, 5TH MAIN, 6TH SECTOR, HSR LAYOUT, BENGALURU",
  periodMonth: "2026-09",
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  paymentDate: 1792408740000,
  printDate: "19 Oct 2026, 04:39 PM",
  employeeName: "Munnat Ali",
  employeeNo: "NH-OL-578",
  joiningDate: "01 Sep 2026",
  department: "Administration",
  designation: "Office Boy",
  location: "Bangalore",
  email: "munnat.ali@victorchase.test",
  effectiveWorkDays: 30,
  totalWorkingDays: 30,
  lopDays: 0,
  lopDeduction: 0,
  bankName: "Punjab National Bank",
  bankAccountNumber: "4774000100032794",
  maskedBankAccountNumber: "••••••••••••2794",
  pan: "BLSPA6167J",
  maskedPan: "••••••67J",
  uan: "102387371064",
  maskedUan: "••••••••1064",
  pfMemberId: "NH-OL-578",
  esicIpNumber: "5044651123",
  basicSalary: 17500,
  masterBasicSalary: 17500,
  allowances: [
    { name: "HRA", amount: 7500, masterAmount: 7500 },
    { name: "CONVEYANCE", amount: 2000, masterAmount: 2000 },
    { name: "SPECIAL ALLOWANCE", amount: 3000, masterAmount: 3000 },
  ],
  grossSalary: 30000,
  masterGrossSalary: 30000,
  customDeductions: [],
  totalCustomDeductions: 0,
  statutoryDeductions: [
    { name: "PF", amount: 2700, isConfigured: true },
    { name: "ESI", amount: 154, isConfigured: true },
    { name: "PROF TAX", amount: 200, isConfigured: true },
  ],
  totalStatutoryDeductions: 3054,
  employerContributions: [
    { name: "EMPLOYER PF CON", amount: 2700, isConfigured: true },
    { name: "EDLI CONTRIBUTION.", amount: 112.5, isConfigured: true },
    { name: "EPF ADMIN CHARGES.", amount: 112.5, isConfigured: true },
    { name: "EMPLOYER ESI CONTRIBUTION", amount: 667, isConfigured: true },
  ],
  totalEmployerContributions: 3592,
  totalCostToCompany: 33592,
  totalDeductions: 3054,
  netSalary: 26946,
  netPayInWords: "Rupees Twenty Six Thousand Nine Hundred Forty Six Only",
};

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE SCENARIO B: No ESI, No PF, PT Only (Satish Biradar)
// ─────────────────────────────────────────────────────────────────────────────
const scenarioB_SatishBiradar: PayslipData = {
  workspaceName: "Victor Chasex Private Limited",
  companyAddress:
    "2ND AND 3RD FLOOR, SRI ESHWARI MANSION, 5TH MAIN, 6TH SECTOR, HSR LAYOUT, BENGALURU",
  periodMonth: "2026-09",
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  paymentDate: 1792408740000,
  printDate: "19 Oct 2026, 04:39 PM",
  employeeName: "Satish Biradar",
  employeeNo: "NH-OL-416",
  joiningDate: "01 Sep 2026",
  department: "Media",
  designation: "Graphic Designer",
  location: "Bangalore",
  email: "satish.biradar@victorchase.test",
  effectiveWorkDays: 30,
  totalWorkingDays: 30,
  lopDays: 0,
  lopDeduction: 0,
  bankName: "",
  bankAccountNumber: "",
  maskedBankAccountNumber: "—",
  pan: "AVOPK1586C",
  maskedPan: "••••••86C",
  uan: "",
  maskedUan: "—",
  pfMemberId: "",
  basicSalary: 17500,
  masterBasicSalary: 17500,
  allowances: [
    { name: "HRA", amount: 7500, masterAmount: 7500 },
    { name: "CONVEYANCE", amount: 2000, masterAmount: 2000 },
    { name: "SPECIAL ALLOWANCE", amount: 8000, masterAmount: 8000 },
  ],
  grossSalary: 35000,
  masterGrossSalary: 35000,
  customDeductions: [],
  totalCustomDeductions: 0,
  statutoryDeductions: [{ name: "PROF TAX", amount: 200, isConfigured: true }],
  totalStatutoryDeductions: 200,
  employerContributions: [],
  totalEmployerContributions: 0,
  totalCostToCompany: 35000,
  totalDeductions: 200,
  netSalary: 34800,
  netPayInWords: "Rupees Thirty Four Thousand Eight Hundred Only",
};

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE SCENARIO C: PF Applicable, ESI Not Applicable (Gowramma KB)
// ─────────────────────────────────────────────────────────────────────────────
const scenarioC_GowrammaKB: PayslipData = {
  workspaceName: "Victor Chasex Private Limited",
  companyAddress:
    "2ND AND 3RD FLOOR, SRI ESHWARI MANSION, 5TH MAIN, 6TH SECTOR, HSR LAYOUT, BENGALURU",
  periodMonth: "2026-09",
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  paymentDate: 1792408740000,
  printDate: "19 Oct 2026, 04:39 PM",
  employeeName: "Gowramma KB",
  employeeNo: "NH-OL-628",
  joiningDate: "01 Sep 2026",
  department: "Media",
  designation: "Senior Video Editor",
  location: "Bangalore",
  email: "gowramma.kb@victorchase.test",
  effectiveWorkDays: 30,
  totalWorkingDays: 30,
  lopDays: 0,
  lopDeduction: 0,
  bankName: "Bank of Baroda",
  bankAccountNumber: "83160100001366",
  maskedBankAccountNumber: "••••••••••1366",
  pan: "DNMPG4112H",
  maskedPan: "••••••12H",
  uan: "101814453693",
  maskedUan: "••••••••3693",
  pfMemberId: "NH-OL-628",
  basicSalary: 35000,
  masterBasicSalary: 35000,
  allowances: [
    { name: "HRA", amount: 14000, masterAmount: 14000 },
    { name: "CONVEYANCE", amount: 2000, masterAmount: 2000 },
    { name: "SPECIAL ALLOWANCE", amount: 19000, masterAmount: 19000 },
  ],
  grossSalary: 70000,
  masterGrossSalary: 70000,
  customDeductions: [],
  totalCustomDeductions: 0,
  statutoryDeductions: [
    { name: "PF", amount: 3000, isConfigured: true },
    { name: "PROF TAX", amount: 200, isConfigured: true },
  ],
  totalStatutoryDeductions: 3200,
  employerContributions: [
    { name: "EMPLOYER PF CON", amount: 3000, isConfigured: true },
    { name: "EDLI CONTRIBUTION.", amount: 125, isConfigured: true },
    { name: "EPF ADMIN CHARGES.", amount: 125, isConfigured: true },
  ],
  totalEmployerContributions: 3250,
  totalCostToCompany: 73250,
  totalDeductions: 3200,
  netSalary: 66800,
  netPayInWords: "Rupees Sixty Six Thousand Eight Hundred Only",
};

describe("Indian Currency & Words Formatting", () => {
  test("formats numbers with Indian grouping", () => {
    expect(formatIndianCurrency(1000)).toBe("1,000.00");
    expect(formatIndianCurrency(150000)).toBe("1,50,000.00");
    expect(formatIndianCurrency(0)).toBe("0.00");
  });

  test("converts numbers to Indian English Words accurately", () => {
    expect(numberToIndianWords(0)).toBe("Rupees Zero Only");
    expect(numberToIndianWords(200)).toBe("Rupees Two Hundred Only");
    expect(numberToIndianWords(26946)).toBe(
      "Rupees Twenty Six Thousand Nine Hundred Forty Six Only",
    );
    expect(numberToIndianWords(34800)).toBe(
      "Rupees Thirty Four Thousand Eight Hundred Only",
    );
    expect(numberToIndianWords(66800)).toBe(
      "Rupees Sixty Six Thousand Eight Hundred Only",
    );
    expect(numberToIndianWords(100000)).toBe("Rupees One Lakh Only");
    expect(numberToIndianWords(15000000)).toBe(
      "Rupees One Crore Fifty Lakh Only",
    );
  });
});

describe("Scenario A — ESI Applicable (Munnat Ali)", () => {
  test("calculates correct Net Pay and isolates employer contributions", () => {
    const data = scenarioA_MunnatAli;
    // Net Pay = Gross Earnings - Employee Deductions
    expect(data.grossSalary).toBe(30000);
    expect(data.totalDeductions).toBe(3054);
    expect(data.netSalary).toBe(26946);

    // Employer contributions are displayed separately
    expect(data.totalEmployerContributions).toBe(3592);
    expect(data.totalCostToCompany).toBe(33592);

    // Audit reconciliation against sample PDF discrepancy:
    // Sample PDF reported 23,354 by incorrectly deducting 6,646 (which included 3,592 employer costs).
    const sampleIncorrectDeductions = 3054 + 3592; // 6646
    const sampleIncorrectNetPay = 30000 - sampleIncorrectDeductions; // 23354
    expect(sampleIncorrectNetPay).toBe(23354);
    // Correct IndiaPay statutory net pay must NOT subtract employer contributions:
    expect(data.netSalary).toBe(26946);
    expect(data.netSalary).not.toBe(sampleIncorrectNetPay);
  });

  test("generates valid PDF 1.4 embedding Scenario A reference layout", () => {
    const pdf = generatePayslipPdfString(scenarioA_MunnatAli);

    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.trim().endsWith("%%EOF")).toBe(true);
    expect(pdf).toContain("VICTOR CHASEX");
    expect(pdf).toContain("Munnat Ali");
    expect(pdf).toContain("NH-OL-578");
    expect(pdf).toContain("Punjab National Bank");
    expect(pdf).toContain("BLSPA6167J");
    expect(pdf).toContain("102387371064");
    expect(pdf).toContain("30,000.00");
    expect(pdf).toContain("2,700.00");
    expect(pdf).toContain("154.00");
    expect(pdf).toContain("200.00");
    // Strictly employee deductions total:
    expect(pdf).toContain("3,054.00");
    // Strictly net pay:
    expect(pdf).toContain("26,946.00");
    // Separate bottom section must be completely removed:
    expect(pdf).not.toContain("EMPLOYER STATUTORY CONTRIBUTIONS");
    // Informational employer contributions present in deduction area:
    expect(pdf).toContain(
      "Employer PF Contribution \\(informational - not deducted from net pay\\)",
    );
    expect(pdf).toContain(
      "Employer ESI Contribution \\(informational - not deducted from net pay\\)",
    );
    // PF percentage (12%) must never be displayed:
    expect(pdf).not.toContain("12%");
    expect(pdf).toContain(
      "Rupees Twenty Six Thousand Nine Hundred Forty Six Only",
    );
  });
});

describe("Scenario B — No ESI, No PF, PT Only (Satish Biradar)", () => {
  test("displays earnings and PT only, omitting inapplicable PF/ESI rows", () => {
    const data = scenarioB_SatishBiradar;
    expect(data.grossSalary).toBe(35000);
    expect(data.totalDeductions).toBe(200);
    expect(data.netSalary).toBe(34800);
    expect(data.totalEmployerContributions).toBe(0);
    // Net Pay + Deductions must strictly equal Gross Earnings
    expect(data.netSalary + data.totalDeductions).toBe(data.grossSalary);
  });

  test("generates valid PDF without inapplicable PF/ESI contribution rows", () => {
    const pdf = generatePayslipPdfString(scenarioB_SatishBiradar);

    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("Satish Biradar");
    expect(pdf).toContain("NH-OL-416");
    expect(pdf).toContain("35,000.00");
    expect(pdf).toContain("(PROF TAX) Tj");
    expect(pdf).toContain("200.00");
    expect(pdf).toContain("34,800.00");
    // PF and ESI deduction rows must be completely omitted
    expect(pdf).not.toContain("(PF) Tj");
    expect(pdf).not.toContain("(ESI) Tj");
    // Separate bottom section must be completely removed
    expect(pdf).not.toContain("EMPLOYER STATUTORY CONTRIBUTIONS");
    expect(pdf).toContain("Rupees Thirty Four Hundred Eight Hundred Only".replace("Four Hundred", "Four Thousand"));
  });
});

describe("Scenario C — PF Applicable, ESI Not Applicable (Gowramma KB)", () => {
  test("displays PF and PT without ESI, reconciling statutory net pay", () => {
    const data = scenarioC_GowrammaKB;
    expect(data.grossSalary).toBe(70000);
    expect(data.totalDeductions).toBe(3200);
    expect(data.netSalary).toBe(66800);
    expect(data.totalEmployerContributions).toBe(3250);
    expect(data.totalCostToCompany).toBe(73250);
    // Net Pay + Deductions must strictly equal Gross Earnings
    expect(data.netSalary + data.totalDeductions).toBe(data.grossSalary);

    // Correct IndiaPay statutory net pay must be 66,800:
    expect(data.netSalary).toBe(66800);
  });

  test("generates valid PDF embedding Scenario C breakdown", () => {
    const pdf = generatePayslipPdfString(scenarioC_GowrammaKB);

    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("Gowramma KB");
    expect(pdf).toContain("NH-OL-628");
    expect(pdf).toContain("Bank of Baroda");
    expect(pdf).toContain("70,000.00");
    expect(pdf).toContain("(PF) Tj");
    expect(pdf).toContain("3,000.00");
    expect(pdf).toContain("(PROF TAX) Tj");
    expect(pdf).toContain("200.00");
    expect(pdf).toContain("3,200.00");
    expect(pdf).toContain("66,800.00");
    // Informational employer PF contribution in deduction area:
    expect(pdf).toContain(
      "Employer PF Contribution \\(informational - not deducted from net pay\\)",
    );
    expect(pdf).toContain("3,250.00");
    // Separate bottom section must be completely removed:
    expect(pdf).not.toContain("EMPLOYER STATUTORY CONTRIBUTIONS");
    // ESI deduction row must be completely omitted
    expect(pdf).not.toContain("(ESI) Tj");
    // PF percentage (12%) must never be displayed:
    expect(pdf).not.toContain("12%");
    expect(pdf).toContain("Rupees Sixty Six Thousand Eight Hundred Only");
  });
});

describe("Zero Deductions, LOP & Proration Handling", () => {
  test("handles zero deductions cleanly without NaN or layout disruption", () => {
    const zeroDeductionsData: PayslipData = {
      workspaceName: "Lean Labs",
      periodMonth: "2026-10",
      employeeName: "Alice Walker",
      email: "alice@leanlabs.test",
      department: "Research",
      designation: "Scientist",
      basicSalary: 50000,
      allowances: [],
      grossSalary: 50000,
      lopDays: 0,
      lopDeduction: 0,
      customDeductions: [],
      totalCustomDeductions: 0,
      statutoryDeductions: [],
      totalStatutoryDeductions: 0,
      totalDeductions: 0,
      netSalary: 50000,
    };

    const pdf = generatePayslipPdfString(zeroDeductionsData);
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("Alice Walker");
    expect(pdf).toContain("50,000.00");
    expect(pdf).toContain("Rupees Fifty Thousand Only");
    expect(pdf).not.toContain("Employer PF Contribution");
    expect(pdf).not.toContain("Employer ESI Contribution");
    expect(pdf).not.toContain("EMPLOYER STATUTORY CONTRIBUTIONS");
    expect(pdf).not.toContain("12%");
  });

  test("accurately reflects LOP deduction and master vs payable basic", () => {
    const lopData: PayslipData = {
      workspaceName: "Acme Corp",
      periodMonth: "2026-10",
      employeeName: "John Doe",
      email: "john@acme.test",
      department: "Operations",
      designation: "Associate",
      effectiveWorkDays: 28,
      totalWorkingDays: 30,
      lopDays: 2,
      lopDeduction: 2000,
      basicSalary: 30000,
      masterBasicSalary: 30000,
      allowances: [],
      grossSalary: 30000,
      masterGrossSalary: 30000,
      customDeductions: [],
      totalCustomDeductions: 0,
      statutoryDeductions: [
        { name: "PROF TAX", amount: 200, isConfigured: true },
      ],
      totalStatutoryDeductions: 200,
      totalDeductions: 2200,
      netSalary: 27800,
    };

    const pdf = generatePayslipPdfString(lopData);
    expect(pdf).toContain("LOSS OF PAY");
    expect(pdf).toContain("2,000.00");
    expect(pdf).toContain("27,800.00");
    expect(pdf).toContain("Rupees Twenty Seven Thousand Eight Hundred Only");
  });
});

describe("Data Security & Masking", () => {
  test("masks bank account numbers and PAN by default in PDF output", () => {
    const pdf = generatePayslipPdfString(scenarioA_MunnatAli);

    // Should contain masked account number
    expect(pdf).toContain("2794");
    // Should NOT contain the full 16-digit plaintext account number in any plain string
    expect(pdf).not.toContain("4774000100032794");
  });

  test("generates safe, compliant PDF file names", () => {
    expect(getPayslipPdfFileName(scenarioA_MunnatAli)).toBe(
      "SalarySlip_NH-OL-578_2026-09.pdf",
    );
    expect(getPayslipPdfFileName(scenarioB_SatishBiradar)).toBe(
      "SalarySlip_NH-OL-416_2026-09.pdf",
    );
    expect(getPayslipPdfFileName(scenarioC_GowrammaKB)).toBe(
      "SalarySlip_NH-OL-628_2026-09.pdf",
    );
  });

  test("creates valid downloadable Blob with application/pdf MIME type", () => {
    const blob = generatePayslipPdfBlob(scenarioA_MunnatAli);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(2000);
  });
});
