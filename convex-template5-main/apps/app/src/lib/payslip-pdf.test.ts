import { describe, expect, test } from "vitest";
import {
  type PayslipData,
  formatIndianCurrency,
  generatePayslipPdfBlob,
  generatePayslipPdfString,
  getPayslipPdfFileName,
} from "./payslip-pdf";

const mockSamplePayslip: PayslipData = {
  workspaceName: "Acme Tech Solutions Pvt Ltd",
  periodMonth: "2026-04",
  startDate: "2026-04-01",
  endDate: "2026-04-30",
  paymentDate: 1777593600000,
  employeeName: "Arun Kumar",
  email: "arun.kumar@acme.test",
  department: "Engineering",
  designation: "Staff Software Engineer",
  phone: "+91 9876543210",
  employeeId: "emp_101",
  basicSalary: 60000,
  allowances: [
    { name: "House Rent Allowance (HRA)", amount: 30000 },
    { name: "Special Allowance", amount: 20000 },
    { name: "Conveyance", amount: 5000 },
  ],
  grossSalary: 115000,
  lopDays: 1,
  lopDeduction: 3833,
  customDeductions: [{ name: "Gym Membership", amount: 1000 }],
  totalCustomDeductions: 1000,
  statutoryDeductions: [
    { name: "PF (Provident Fund - 12%)", amount: 1800, isConfigured: true },
    { name: "ESI (Employee State Insurance)", amount: 0, isConfigured: false },
    { name: "Professional Tax (PT)", amount: 200, isConfigured: true },
    { name: "TDS (Income Tax)", amount: 12000, isConfigured: true },
  ],
  totalStatutoryDeductions: 14000,
  employerContributions: [
    { name: "Employer EPF (3.67%)", amount: 550, isConfigured: true },
    { name: "Employer EPS (8.33%)", amount: 1250, isConfigured: true },
    { name: "EDLI (0.5%)", amount: 75, isConfigured: true },
    { name: "EPFO Admin (0.5%)", amount: 75, isConfigured: true },
  ],
  totalEmployerContributions: 1950,
  totalDeductions: 18833,
  netSalary: 96167,
};

describe("Indian Currency Formatting", () => {
  test("formats numbers with Indian comma grouping and two decimals", () => {
    expect(formatIndianCurrency(1000)).toBe("1,000.00");
    expect(formatIndianCurrency(150000)).toBe("1,50,000.00");
    expect(formatIndianCurrency(1234567.89)).toBe("12,34,567.89");
    expect(formatIndianCurrency(0)).toBe("0.00");
  });
});

describe("Payslip PDF Generation", () => {
  test("generates valid PDF 1.4 document syntax", () => {
    const pdfString = generatePayslipPdfString(mockSamplePayslip);

    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfString.trim().endsWith("%%EOF")).toBe(true);
    expect(pdfString).toContain("/Type /Catalog");
    expect(pdfString).toContain("/Type /Pages");
    expect(pdfString).toContain("/Type /Page");
    expect(pdfString).toContain("xref");
    expect(pdfString).toContain("trailer");
  });

  test("embeds employer and employee details accurately", () => {
    const pdfString = generatePayslipPdfString(mockSamplePayslip);

    expect(pdfString).toContain("ACME TECH SOLUTIONS PVT LTD");
    expect(pdfString).toContain("Arun Kumar");
    expect(pdfString).toContain("Engineering");
    expect(pdfString).toContain("Staff Software Engineer");
    expect(pdfString).toContain("PAYSLIP FOR 2026-04");
  });

  test("embeds financial figures and statutory breakdowns from finalized payroll", () => {
    const pdfString = generatePayslipPdfString(mockSamplePayslip);

    // Basic & Gross
    expect(pdfString).toContain("Basic Salary");
    expect(pdfString).toContain("60,000.00");
    expect(pdfString).toContain("1,15,000.00");

    // LOP & Custom deductions
    expect(pdfString).toContain("Loss of Pay");
    expect(pdfString).toContain("3,833.00");
    expect(pdfString).toContain("Gym Membership");

    // Net Salary
    expect(pdfString).toContain("NET SALARY PAYABLE");
    expect(pdfString).toContain("96,167.00");

    // Employer Contributions
    expect(pdfString).toContain("Employer EPS");
    expect(pdfString).toContain("1,950.00");
  });

  test("generates valid Blob with application/pdf mime type", () => {
    const blob = generatePayslipPdfBlob(mockSamplePayslip);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1500);
  });

  test("handles missing optional values and zero deductions safely", () => {
    const minimalPayslip: PayslipData = {
      workspaceName: "Lean Startup",
      periodMonth: "2026-05",
      employeeName: "Bob Smith",
      email: "bob@lean.test",
      department: "Marketing",
      designation: "Associate",
      basicSalary: 25000,
      allowances: [],
      grossSalary: 25000,
      lopDays: 0,
      lopDeduction: 0,
      customDeductions: [],
      totalCustomDeductions: 0,
      statutoryDeductions: [],
      totalStatutoryDeductions: 0,
      totalDeductions: 0,
      netSalary: 25000,
    };

    const pdfString = generatePayslipPdfString(minimalPayslip);
    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfString.trim().endsWith("%%EOF")).toBe(true);
    expect(pdfString).toContain("Bob Smith");
    expect(pdfString).toContain("25,000.00");
  });

  test("generates meaningful, safe filename: SalarySlip_<EmployeeID>_<YYYY-MM>.pdf", () => {
    // When employeeId is present
    const fileNameWithId = getPayslipPdfFileName(mockSamplePayslip);
    expect(fileNameWithId).toBe("SalarySlip_emp_101_2026-04.pdf");

    // When employeeId is missing, falls back safely to sanitized employeeName
    const payslipWithoutId: PayslipData = {
      ...mockSamplePayslip,
      employeeId: undefined,
      employeeName: "Jane Doe / Special*Chars!",
      periodMonth: "2026-10",
    };
    const fileNameWithoutId = getPayslipPdfFileName(payslipWithoutId);
    expect(fileNameWithoutId).toBe(
      "SalarySlip_Jane_Doe___Special_Chars__2026-10.pdf",
    );
    expect(fileNameWithoutId.endsWith(".pdf")).toBe(true);
    expect(fileNameWithoutId).not.toContain("/");
    expect(fileNameWithoutId).not.toContain("*");
  });
});
