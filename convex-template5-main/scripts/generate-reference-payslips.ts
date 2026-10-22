import fs from "node:fs";
import path from "node:path";
import {
  type PayslipData,
  generatePayslipPdfString,
  numberToIndianWords,
} from "../apps/app/src/lib/payslip-pdf";

const scenario1_MunnatAli: PayslipData = {
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
  netPayInWords: numberToIndianWords(26946),
};

const scenario2_SatishBiradar: PayslipData = {
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
  statutoryDeductions: [
    { name: "PROF TAX", amount: 200, isConfigured: true },
  ],
  totalStatutoryDeductions: 200,
  employerContributions: [],
  totalEmployerContributions: 0,
  totalCostToCompany: 35000,
  totalDeductions: 200,
  netSalary: 34800,
  netPayInWords: numberToIndianWords(34800),
};

const scenario3_GowrammaKB: PayslipData = {
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
  netPayInWords: numberToIndianWords(66800),
};

const outputDirs = [
  path.resolve(__dirname, "../reference_reports/generated_payslips"),
  path.resolve(
    "C:/Users/DELL 3511 (243597)/.gemini/antigravity-ide/brain/42c4cccd-bbbf-4cdb-a8f5-edf4656fd5b0/generated_payslips"
  ),
];

for (const outDir of outputDirs) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
}

const scenarios = [
  {
    name: "Payslip_Scenario_1_ESI_PF_PT_Munnat_Ali.pdf",
    data: scenario1_MunnatAli,
  },
  {
    name: "Payslip_Scenario_2_PT_Only_Satish_Biradar.pdf",
    data: scenario2_SatishBiradar,
  },
  {
    name: "Payslip_Scenario_3_PF_PT_No_ESI_Gowramma_KB.pdf",
    data: scenario3_GowrammaKB,
  },
];

console.log("Generating reference payslip PDFs...\n");

for (const s of scenarios) {
  const pdfString = generatePayslipPdfString(s.data);
  const buffer = Buffer.from(pdfString, "binary");

  for (const outDir of outputDirs) {
    const filePath = path.join(outDir, s.name);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved: ${filePath} (${buffer.length} bytes)`);
  }

  // Quick sanity checks on PDF
  const isValidHeader = pdfString.startsWith("%PDF-1.4");
  const isValidTrailer = pdfString.trim().endsWith("%%EOF");
  console.log(`  - Valid PDF Header: ${isValidHeader}`);
  console.log(`  - Valid PDF EOF: ${isValidTrailer}`);
  console.log(`  - Employee: ${s.data.employeeName}`);
  console.log(`  - Gross: ₹${s.data.grossSalary.toLocaleString("en-IN")}`);
  console.log(`  - Net: ₹${s.data.netSalary.toLocaleString("en-IN")}`);
  console.log(`  - Words: ${s.data.netPayInWords}`);
  console.log(`  - CTC: ₹${(s.data.totalCostToCompany ?? 0).toLocaleString("en-IN")}\n`);
}

console.log("All 3 reference payslip PDFs generated successfully.");
