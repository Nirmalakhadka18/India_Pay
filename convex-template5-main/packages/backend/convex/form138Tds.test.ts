import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id, MutationCtx } from "./_generated/dataModel";
import {
  TDS_DELIMITER,
  formatDateDDMMYYYY,
  formatTwoDecimals,
  getAssessmentYear,
  getQuarterMonths,
  isForm138Applicable,
  validatePan,
  validateTan,
} from "./form138Tds";
import schema from "./schema";

// Discover function modules for convex-test (includes _generated, excludes *.test.ts).
const modules: Record<string, () => Promise<any>> =
  typeof (import.meta as any).glob === "function"
    ? (import.meta as any).glob(["./**/*.*s", "!./**/*.test.*"])
    : {
        "./ResendOTP.ts": () => import("./ResendOTP"),
        "./apiKeys.ts": () => import("./apiKeys"),
        "./audit.ts": () => import("./audit"),
        "./auditLog.ts": () => import("./auditLog"),
        "./auth.config.ts": () => import("./auth.config"),
        "./auth.ts": () => import("./auth"),
        "./backend.ts": () => import("./backend"),
        "./counters.ts": () => import("./counters"),
        "./dashboard.ts": () => import("./dashboard"),
        "./devGuard.ts": () => import("./devGuard"),
        "./email.ts": () => import("./email"),
        "./env.ts": () => import("./env"),
        "./files.ts": () => import("./files"),
        "./http.ts": () => import("./http"),
        "./init.ts": () => import("./init"),
        "./jobs.ts": () => import("./jobs"),
        "./notifications.ts": () => import("./notifications"),
        "./orgs.ts": () => import("./orgs"),
        "./passwordProviders.ts": () => import("./passwordProviders"),
        "./schema.ts": () => import("./schema"),
        "./seed.ts": () => import("./seed"),
        "./sessions.ts": () => import("./sessions"),
        "./subscriptions.ts": () => import("./subscriptions"),
        "./usage.ts": () => import("./usage"),
        "./users.ts": () => import("./users"),
        "./web.ts": () => import("./web"),
        "./attendance.ts": () => import("./attendance"),
        "./compliance.ts": () => import("./compliance"),
        "./employees.ts": () => import("./employees"),
        "./leaves.ts": () => import("./leaves"),
        "./lop.ts": () => import("./lop"),
        "./payroll.ts": () => import("./payroll"),
        "./salaries.ts": () => import("./salaries"),
        "./statutory.ts": () => import("./statutory"),
        "./devAccounts.ts": () => import("./devAccounts"),
        "./devAccountsMutation.ts": () => import("./devAccountsMutation"),
        "./statutoryReports.ts": () => import("./statutoryReports"),
        "./epfoEcr.ts": () => import("./epfoEcr"),
        "./form138Tds.ts": () => import("./form138Tds"),
        "./declarations.ts": () => import("./declarations"),
        "./professionalTax.ts": () => import("./professionalTax"),
        "./lwf.ts": () => import("./lwf"),
        "./statutoryTds.ts": () => import("./statutoryTds"),
        "./_generated/api.js": () => import("./_generated/api.js"),
        "./_generated/server.js": () => import("./_generated/server.js"),
      };

const as = (userId: string) => ({ subject: `${userId}|sess_${userId}` });

async function seedTdsWorkspace(
  t: ReturnType<typeof convexTest>,
  options: {
    tan?: string;
    employerPan?: string;
    responsiblePersonName?: string;
    responsiblePersonPan?: string;
    deductorType?: "company" | "individual" | "firm" | "government" | "other";
    paoCode?: string;
    ddoCode?: string;
    ministryName?: string;
  } = {},
) {
  let adminId!: Id<"users">;
  let wsId!: Id<"workspaces">;

  await t.run(async (ctx: MutationCtx) => {
    adminId = await ctx.db.insert("users", {
      name: "Payroll Admin",
      email: "admin@indiapay.com",
    });

    wsId = await ctx.db.insert("workspaces", {
      name: "IndiaPay Technologies Pvt Ltd",
      ownerId: adminId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("members", {
      workspaceId: wsId,
      userId: adminId,
      role: "owner",
      createdAt: Date.now(),
    });

    await ctx.db.insert("workspaceCompliance", {
      workspaceId: wsId,
      epfEnabled: true,
      esiEnabled: false,
      ptEnabled: true,
      ptState: "Karnataka",
      tan: options.tan ?? "BLRK12345A",
      employerPan: options.employerPan ?? "AABCI1234F",
      deductorType: options.deductorType ?? "company",
      paoCode: options.paoCode,
      ddoCode: options.ddoCode,
      ministryName: options.ministryName,
      responsiblePersonName: options.responsiblePersonName ?? "Ramesh Gupta",
      responsiblePersonPan: options.responsiblePersonPan ?? "ABCDE1234F",
      responsiblePersonDesignation: "Finance Director",
      responsiblePersonEmail: "ramesh@indiapay.com",
      responsiblePersonMobile: "9876543210",
      responsiblePersonAddress: "MG Road, Bengaluru",
      updatedAt: Date.now(),
    });
  });

  return { ws: wsId, admin: adminId };
}

describe("Form 138 & Form 24Q Statutory Unit Rules", () => {
  test("isForm138Applicable correctly differentiates FY 2026-27 from FY 2025-26", () => {
    expect(isForm138Applicable("2026-27")).toBe(true);
    expect(isForm138Applicable("2027-28")).toBe(true);
    expect(isForm138Applicable("2025-26")).toBe(false);
    expect(isForm138Applicable("2024-25")).toBe(false);
  });

  test("getAssessmentYear computes correct subsequent AY", () => {
    expect(getAssessmentYear("2026-27")).toBe("2027-28");
    expect(getAssessmentYear("2025-26")).toBe("2026-27");
  });

  test("getQuarterMonths maps exact 3 months for all four quarters", () => {
    const q1 = getQuarterMonths("2026-27", "Q1");
    expect(q1.months).toEqual(["2026-04", "2026-05", "2026-06"]);

    const q2 = getQuarterMonths("2026-27", "Q2");
    expect(q2.months).toEqual(["2026-07", "2026-08", "2026-09"]);

    const q3 = getQuarterMonths("2026-27", "Q3");
    expect(q3.months).toEqual(["2026-10", "2026-11", "2026-12"]);

    const q4 = getQuarterMonths("2026-27", "Q4");
    expect(q4.months).toEqual(["2027-01", "2027-02", "2027-03"]);
  });

  test("validateTan enforces 10-char alphanumeric TAN specification", () => {
    expect(validateTan("BLRK12345A").valid).toBe(true);
    expect(validateTan("blrk12345a").cleanTan).toBe("BLRK12345A");
    expect(validateTan("").valid).toBe(false);
    expect(validateTan("12345").valid).toBe(false);
    expect(validateTan("INVALIDTAN1").valid).toBe(false);
  });

  test("validatePan handles standard PAN, PANNOTAVBL, and rejects malformed values", () => {
    expect(validatePan("ABCDE1234F", "Test Employee").valid).toBe(true);
    expect(validatePan("PANNOTAVBL", "Unregistered").valid).toBe(true);
    expect(validatePan("", "No Pan").isMissing).toBe(true);
    expect(validatePan("12345", "Bad Pan").valid).toBe(false);
  });

  test("formatTwoDecimals and formatDateDDMMYYYY enforce Protean formatting", () => {
    expect(formatTwoDecimals(15000)).toBe("15000.00");
    expect(formatTwoDecimals(124.5)).toBe("124.50");
    expect(formatDateDDMMYYYY("2026-04-30")).toBe("30042026");
    expect(formatDateDDMMYYYY("2027-01-31")).toBe("31012027");
  });
});

describe("ITNS 281 TDS Challan Management", () => {
  test("saveTdsChallan validates BSR code (7 digits) and serial (5 digits)", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    // Invalid BSR (not 7 digits)
    await expect(
      asAdmin.mutation(api.form138Tds.saveTdsChallan, {
        workspaceId: ws,
        financialYear: "2026-27",
        quarter: "Q1",
        bsrCode: "1234",
        depositDate: "2026-05-07",
        challanSerialNumber: "00123",
        minorHead: "200",
        taxAmount: 50000,
      }),
    ).rejects.toThrow("BSR Code must be exactly 7 numeric digits");

    // Invalid Serial (not 5 digits)
    await expect(
      asAdmin.mutation(api.form138Tds.saveTdsChallan, {
        workspaceId: ws,
        financialYear: "2026-27",
        quarter: "Q1",
        bsrCode: "0210001",
        depositDate: "2026-05-07",
        challanSerialNumber: "12",
        minorHead: "200",
        taxAmount: 50000,
      }),
    ).rejects.toThrow("Challan Serial Number must be exactly 5 numeric digits");

    // Valid Challan
    const challanId = await asAdmin.mutation(api.form138Tds.saveTdsChallan, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
      bsrCode: "0210001",
      depositDate: "2026-05-07",
      challanSerialNumber: "00123",
      minorHead: "200",
      taxAmount: 45000,
      cess: 1800,
      fee: 200,
    });

    expect(challanId).toBeDefined();

    const list = await asAdmin.query(api.form138Tds.listTdsChallans, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });

    expect(list.length).toBe(1);
    expect(list[0]?.totalAmount).toBe(45000 + 1800 + 200);

    // Delete challan
    await asAdmin.mutation(api.form138Tds.deleteTdsChallan, {
      workspaceId: ws,
      challanId,
    });

    const emptyList = await asAdmin.query(api.form138Tds.listTdsChallans, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });
    expect(emptyList.length).toBe(0);
  });
});

describe("Quarterly TDS Filing Generation: Form 138 (FY 2026-27 Q1) & Form 24Q (FY 2025-26 Q2)", () => {
  test("Form 138 (FY 2026-27 Q1) generates FH, BH with form 138, section 1002, and omits Annexure II", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    // Create 2 employees with PAN
    const emp1 = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Rahul",
      lastName: "Dravid",
      email: "rahul@indiapay.com",
      pan: "ABCDE1234F",
    });

    const emp2 = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Virender",
      lastName: "Sehwag",
      email: "virender@indiapay.com",
      pan: "FGHIJ5678K",
    });

    // Add Challan for Q1
    await asAdmin.mutation(api.form138Tds.saveTdsChallan, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
      bsrCode: "0210001",
      depositDate: "2026-05-07",
      challanSerialNumber: "00055",
      minorHead: "200",
      taxAmount: 20000,
    });

    // Seed processed payroll run for 2026-04
    await t.run(async (ctx: MutationCtx) => {
      const runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-04",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        status: "processed",
        totalEmployees: 2,
        totalGrossSalary: 200000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 20000,
        totalEmployerContributions: 0,
        totalNetSalary: 180000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: emp1,
        basicSalary: 50000,
        allowances: [],
        grossSalary: 100000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          {
            name: "TDS (Tax Deducted at Source)",
            amount: 10000,
            isConfigured: true,
          },
        ],
        totalStatutoryDeductions: 10000,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 10000,
        netSalary: 90000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: emp2,
        basicSalary: 50000,
        allowances: [],
        grossSalary: 100000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          {
            name: "TDS (Tax Deducted at Source)",
            amount: 10000,
            isConfigured: true,
          },
        ],
        totalStatutoryDeductions: 10000,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 10000,
        netSalary: 90000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });

    expect(preview.success).toBe(true);
    expect(preview.isForm138).toBe(true);
    expect(preview.formName).toBe("Form 138");
    expect(preview.sectionCode).toBe("1002");
    expect(preview.totalTdsDeducted).toBe(20000);
    expect(preview.totalChallanTaxDeposited).toBe(20000);
    expect(preview.reconciliationShortfall).toBe(0);

    const lines = preview.fileContent!.split("\r\n");

    // Line 1: File Header (FH) - Verified 16-field Protean Specification
    const fhParts = lines[0]!.split(TDS_DELIMITER);
    expect(fhParts[1]).toBe("FH");
    expect(fhParts[2]).toBe("SL1"); // Salary Statement Type
    expect(fhParts[3]).toBe("R"); // Regular Return
    expect(fhParts.length).toBe(16);

    // Line 2: Batch Header (BH) - Verified 60-field Protean Layout
    const bhParts = lines[1]!.split(TDS_DELIMITER);
    expect(bhParts[1]).toBe("BH");
    expect(bhParts[4]).toBe("138"); // Form 138 under Income-tax Act, 2025
    expect(bhParts[10]).toBe("BLRK12345A"); // Deductor TAN
    expect(bhParts[12]).toBe("2026-27"); // FY
    expect(bhParts[14]).toBe("Q1"); // Quarter
    expect(bhParts[17]).toBe("K"); // Category: Company
    expect(bhParts.length).toBe(60);

    // Line 3: Challan Detail (CD) - Verified 30-field Protean Layout
    const cdParts = lines[2]!.split(TDS_DELIMITER);
    expect(cdParts[1]).toBe("CD");
    expect(cdParts[4]).toBe("2"); // 2 deductees mapped to this challan
    expect(cdParts[14]).toBe("00055"); // Serial Number
    expect(cdParts[15]).toBe("0210001"); // Bank BSR Code
    expect(cdParts[17]).toBe("200"); // Minor Head (TDS payable by taxpayer)
    expect(cdParts[25]).toBe("N"); // Non-govt bank challan
    expect(cdParts.length).toBe(30);

    // Lines 4 & 5: Deductee Details (DD) - Annexure I (Verified 30-field Layout)
    const ddParts1 = lines[3]!.split(TDS_DELIMITER);
    expect(ddParts1[1]).toBe("DD");
    expect(ddParts1[3]).toBe("1"); // Mapped to Challan 1
    expect(ddParts1[5]).toBe("O"); // Original Mode
    expect(ddParts1[9]).toBe("ABCDE1234F"); // Employee PAN
    expect(ddParts1[12]).toBe("1002"); // Section 392 Salary Code under 2025 Act
    expect(ddParts1[23]).toBe("N"); // Book Entry Flag: N
    expect(ddParts1.length).toBe(30);

    // Annexure II (SD) MUST be omitted in Q1
    const hasSdRecord = lines.some((l) => l.split(TDS_DELIMITER)[1] === "SD");
    expect(hasSdRecord).toBe(false);
  });

  test("Form 24Q (FY 2025-26 Q2) generates BH with Form 24Q and legacy section code 92B", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Kapil",
      lastName: "Dev",
      email: "kapil@indiapay.com",
      pan: "KLMNO9999P",
    });

    await asAdmin.mutation(api.form138Tds.saveTdsChallan, {
      workspaceId: ws,
      financialYear: "2025-26",
      quarter: "Q2",
      bsrCode: "0210002",
      depositDate: "2025-08-07",
      challanSerialNumber: "00088",
      minorHead: "200",
      taxAmount: 5000,
    });

    await t.run(async (ctx: MutationCtx) => {
      const runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2025-07",
        startDate: "2025-07-01",
        endDate: "2025-07-31",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 50000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 5000,
        totalEmployerContributions: 0,
        totalNetSalary: 45000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
        basicSalary: 25000,
        allowances: [],
        grossSalary: 50000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          { name: "TDS", amount: 5000, isConfigured: true },
        ],
        totalStatutoryDeductions: 5000,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 5000,
        netSalary: 45000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2025-26",
      quarter: "Q2",
    });

    expect(preview.success).toBe(true);
    expect(preview.isForm138).toBe(false);
    expect(preview.formName).toBe("Form 24Q");
    expect(preview.sectionCode).toBe("92B");

    const lines = preview.fileContent!.split("\r\n");
    const bhParts = lines[1]!.split(TDS_DELIMITER);
    expect(bhParts[4]).toBe("24Q");

    const ddParts = lines[3]!.split(TDS_DELIMITER);
    expect(ddParts[12]).toBe("92B"); // Legacy Section 192 Salary Code
  });
});

describe("Quarter 4 Comprehensive Annual Salary & Tax Details (Annexure II)", () => {
  test("Q4 includes SD records with Section 16 Standard Deduction, Chapter VI-A, and Net Tax liability", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Sachin",
      lastName: "Tendulkar",
      email: "sachin@indiapay.com",
      pan: "STXYZ1111A",
    });

    // Add Q4 Challan
    await asAdmin.mutation(api.form138Tds.saveTdsChallan, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q4",
      bsrCode: "0210001",
      depositDate: "2027-02-07",
      challanSerialNumber: "00099",
      minorHead: "200",
      taxAmount: 15000,
    });

    // Seed payroll run in 2027-01 (Q4)
    await t.run(async (ctx: MutationCtx) => {
      const runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2027-01",
        startDate: "2027-01-01",
        endDate: "2027-01-31",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 100000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 5000,
        totalEmployerContributions: 0,
        totalNetSalary: 95000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
        basicSalary: 50000,
        allowances: [],
        grossSalary: 100000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          { name: "TDS", amount: 5000, isConfigured: true },
        ],
        totalStatutoryDeductions: 5000,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 5000,
        netSalary: 95000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });

      // Submit Form 12BB tax declaration
      await ctx.db.insert("taxDeclarations", {
        workspaceId: ws,
        employeeId: empId,
        financialYear: "2026-27",
        regime: "new",
        status: "approved",
        chapterVIA: {
          section80C: 150000,
          section80D: 25000,
        },
        proofs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q4",
    });

    expect(preview.success).toBe(true);
    expect(preview.annualSalaryDetails.length).toBe(1);

    const s = preview.annualSalaryDetails[0]!;
    expect(s.employeeName).toBe("Sachin Tendulkar");
    expect(s.regime).toBe("new");
    expect(s.annualGrossSalary).toBe(100000);
    // Under FY 2026-27 New Tax Regime, standard deduction is ₹75,000 (capped at gross)
    expect(s.standardDeduction).toBe(75000);

    const lines = preview.fileContent!.split("\r\n");
    const sdLine = lines.find((l) => l.split(TDS_DELIMITER)[1] === "SD");
    expect(sdLine).toBeDefined();

    const sdParts = sdLine!.split(TDS_DELIMITER);
    expect(sdParts[1]).toBe("SD");
    expect(sdParts[4]).toBe("STXYZ1111A");
    expect(sdParts[6]).toBe("115BAC"); // New tax regime
    expect(sdParts[14]).toBe("75000.00"); // Standard deduction 16(ia)
  });
});

describe("TDS Actionable Validations & CSV Internal Audit Report", () => {
  test("Missing TAN blocks file generation and provides actionable remediation guidance", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t, { tan: "" });
    const asAdmin = t.withIdentity(as(admin));

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });

    expect(preview.success).toBe(false);
    expect(preview.fileContent).toBeNull();
    expect(
      preview.errors.some((e) => e.includes("Employer TAN is required")),
    ).toBe(true);
  });

  test("CSV audit worksheet contains prominent disclaimer and structured table", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });

    expect(preview.csvContent).toBeDefined();
    expect(preview.csvContent).toContain(
      "NOTICE: INTERNAL AUDIT RECONCILIATION REPORT ONLY. NOT AN OFFICIAL E-FILING ARTIFACT",
    );
    expect(preview.csvFileName).toContain(
      "TDS_Reconciliation_Audit_Q1_2026-27",
    );
  });

  test("Missing PAN results in PANNOTAVBL and Section 206AA reason code B in DD record", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "NoPan",
      lastName: "Employee",
      email: "nopan@indiapay.com",
    });

    await t.run(async (ctx: MutationCtx) => {
      const runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-04",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 60000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 12000,
        totalEmployerContributions: 0,
        totalNetSalary: 48000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
        basicSalary: 60000,
        allowances: [],
        grossSalary: 60000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          { name: "TDS", amount: 12000, isConfigured: true }, // Higher 20% deduction
        ],
        totalStatutoryDeductions: 12000,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 12000,
        netSalary: 48000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });

    expect(preview.success).toBe(true);
    expect(
      preview.warnings.some(
        (w) => w.includes("has no PAN") || w.includes("PANNOTAVBL"),
      ),
    ).toBe(true);

    const lines = preview.fileContent!.split("\r\n");
    const ddLine = lines.find((l) => l.split(TDS_DELIMITER)[1] === "DD");
    expect(ddLine).toBeDefined();

    const ddParts = ddLine!.split(TDS_DELIMITER);
    expect(ddParts[9]).toBe("PANNOTAVBL");
    expect(ddParts[24]).toBe("B"); // Reason code B: Higher rate u/s 206AA
  });

  test("Zero-TDS deductee is assigned reason code C (Nil deduction)", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "NilTax",
      lastName: "Employee",
      email: "niltax@indiapay.com",
      pan: "ABCDE9999Z",
    });

    await t.run(async (ctx: MutationCtx) => {
      const runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-05",
        startDate: "2026-05-01",
        endDate: "2026-05-31",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 30000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 0,
        totalEmployerContributions: 0,
        totalNetSalary: 30000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
        basicSalary: 30000,
        allowances: [],
        grossSalary: 30000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          { name: "TDS", amount: 0, isConfigured: true }, // Zero tax
        ],
        totalStatutoryDeductions: 0,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 0,
        netSalary: 30000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });

    const lines = preview.fileContent!.split("\r\n");
    const ddLine = lines.find((l) => l.split(TDS_DELIMITER)[1] === "DD");
    expect(ddLine).toBeDefined();

    const ddParts = ddLine!.split(TDS_DELIMITER);
    expect(ddParts[16]).toBe("0.00");
    expect(ddParts[24]).toBe("C"); // Reason code C: Below taxable limit / Nil deduction
  });

  test("Multiple employees map to single challan and shortfall warning triggers on underpayment", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const emp1 = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Employee",
      lastName: "One",
      email: "emp1@indiapay.com",
      pan: "ABCDE1231F",
    });

    const emp2 = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Employee",
      lastName: "Two",
      email: "emp2@indiapay.com",
      pan: "ABCDE1232F",
    });

    await t.run(async (ctx: MutationCtx) => {
      const runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-04",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        status: "processed",
        totalEmployees: 2,
        totalGrossSalary: 150000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 10000,
        totalEmployerContributions: 0,
        totalNetSalary: 140000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      for (const [idx, empId] of [emp1, emp2].entries()) {
        await ctx.db.insert("payrollItems", {
          workspaceId: ws,
          payrollRunId: runId,
          employeeId: empId,
          basicSalary: 75000,
          allowances: [],
          grossSalary: 75000,
          lopDays: 0,
          lopDeduction: 0,
          customDeductions: [],
          totalCustomDeductions: 0,
          statutoryDeductions: [
            { name: "TDS", amount: 5000, isConfigured: true },
          ],
          totalStatutoryDeductions: 5000,
          employerContributions: [],
          totalEmployerContributions: 0,
          totalDeductions: 5000,
          netSalary: 70000,
          hasSalaryStructure: true,
          warnings: [],
          createdAt: Date.now(),
        });
      }

      // Add a single challan for only ₹7,000 (Shortfall of ₹3,000)
      await ctx.db.insert("tdsChallans", {
        workspaceId: ws,
        financialYear: "2026-27",
        quarter: "Q1",
        bsrCode: "0210001",
        depositDate: "2026-05-07",
        challanSerialNumber: "00101",
        minorHead: "200",
        taxAmount: 7000,
        surcharge: 0,
        cess: 0,
        interest: 0,
        fee: 0,
        penalty: 0,
        totalAmount: 7000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });

    expect(preview.totalDeductees).toBe(2);
    expect(preview.totalTdsDeducted).toBe(10000);
    expect(preview.totalChallanTaxDeposited).toBe(7000);
    expect(preview.reconciliationShortfall).toBe(3000);
    expect(
      preview.warnings.some((w) => w.includes("underpayment detected")),
    ).toBe(true);

    // Both deductees link to challan index 1
    const lines = preview.fileContent!.split("\r\n");
    const ddLines = lines.filter((l) => l.split(TDS_DELIMITER)[1] === "DD");
    expect(ddLines.length).toBe(2);
    expect(ddLines[0]!.split(TDS_DELIMITER)[3]).toBe("1");
    expect(ddLines[1]!.split(TDS_DELIMITER)[3]).toBe("1");
  });

  test("Returns official filing verification metadata with FVU version requirements", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    // FY 2026-27 -> FVU 1.2
    const preview138 = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });
    expect(preview138.isOfficialFilingVerified).toBe(false);
    expect(preview138.fvuVersionRequired).toBe("e-TDS/TCS FVU Version 1.2");
    expect(preview138.filingFormatStatus).toBe("DRAFT_LAYOUT_PREVIEW_ONLY");

    // FY 2025-26 -> FVU 9.5
    const preview24Q = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2025-26",
      quarter: "Q2",
    });
    expect(preview24Q.isOfficialFilingVerified).toBe(false);
    expect(preview24Q.fvuVersionRequired).toBe("e-TDS/TCS FVU Version 9.5");
  });

  test("Government deductor generates BH with category G, PAO/DDO codes, and Book Entry Y in CD and DD records", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t, {
      deductorType: "government",
      paoCode: "PAO12345",
      ddoCode: "DDO67890",
      ministryName: "MINISTRY OF COMMUNICATIONS",
    });
    const asAdmin = t.withIdentity(as(admin));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Govt",
      lastName: "Officer",
      email: "officer@gov.in",
      pan: "GOVTO1234F",
    });

    await asAdmin.mutation(api.form138Tds.saveTdsChallan, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
      bsrCode: "0210001",
      depositDate: "2026-05-07",
      challanSerialNumber: "00077",
      minorHead: "200",
      taxAmount: 8000,
    });

    await t.run(async (ctx: MutationCtx) => {
      const runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-04",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 80000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 8000,
        totalEmployerContributions: 0,
        totalNetSalary: 72000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
        basicSalary: 40000,
        allowances: [],
        grossSalary: 80000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          { name: "TDS", amount: 8000, isConfigured: true },
        ],
        totalStatutoryDeductions: 8000,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 8000,
        netSalary: 72000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });

    expect(preview.success).toBe(true);
    const lines = preview.fileContent!.split("\r\n");

    // BH Record: category G, PAO code, DDO code, Ministry Name
    const bhParts = lines[1]!.split(TDS_DELIMITER);
    expect(bhParts[17]).toBe("G"); // Category
    expect(bhParts[18]).toBe("PAO12345"); // PAO Code
    expect(bhParts[19]).toBe("DDO67890"); // DDO Code
    expect(bhParts[20]).toBe("MINISTRY OF COMMUNICATIONS"); // Ministry

    // CD Record: Book Entry Flag === "Y"
    const cdParts = lines[2]!.split(TDS_DELIMITER);
    expect(cdParts[25]).toBe("Y"); // Book entry for govt

    // DD Record: Book Entry Flag === "Y"
    const ddParts = lines[3]!.split(TDS_DELIMITER);
    expect(ddParts[23]).toBe("Y"); // Book entry for govt
  });

  test("Multiple challans accurately distribute and allocate deductee records across CD and DD control totals", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const emp1 = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Deductee",
      lastName: "One",
      email: "d1@indiapay.com",
      pan: "AAAAA1111A",
    });

    const emp2 = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Deductee",
      lastName: "Two",
      email: "d2@indiapay.com",
      pan: "BBBBB2222B",
    });

    // Add 2 Challans: Challan 1 for ₹5,000, Challan 2 for ₹5,000
    await asAdmin.mutation(api.form138Tds.saveTdsChallan, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
      bsrCode: "0210001",
      depositDate: "2026-05-07",
      challanSerialNumber: "00001",
      minorHead: "200",
      taxAmount: 5000,
    });

    await asAdmin.mutation(api.form138Tds.saveTdsChallan, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
      bsrCode: "0210001",
      depositDate: "2026-06-07",
      challanSerialNumber: "00002",
      minorHead: "200",
      taxAmount: 5000,
    });

    await t.run(async (ctx: MutationCtx) => {
      const runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-04",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        status: "processed",
        totalEmployees: 2,
        totalGrossSalary: 100000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 10000,
        totalEmployerContributions: 0,
        totalNetSalary: 90000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      for (const [idx, empId] of [emp1, emp2].entries()) {
        await ctx.db.insert("payrollItems", {
          workspaceId: ws,
          payrollRunId: runId,
          employeeId: empId,
          basicSalary: 25000,
          allowances: [],
          grossSalary: 50000,
          lopDays: 0,
          lopDeduction: 0,
          customDeductions: [],
          totalCustomDeductions: 0,
          statutoryDeductions: [
            { name: "TDS", amount: 5000, isConfigured: true },
          ],
          totalStatutoryDeductions: 5000,
          employerContributions: [],
          totalEmployerContributions: 0,
          totalDeductions: 5000,
          netSalary: 45000,
          hasSalaryStructure: true,
          warnings: [],
          createdAt: Date.now(),
        });
      }
    });

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });

    expect(preview.success).toBe(true);
    expect(preview.totalChallans).toBe(2);
    expect(preview.totalDeductees).toBe(2);
    expect(preview.totalTdsDeducted).toBe(10000);
    expect(preview.totalChallanTaxDeposited).toBe(10000);
    expect(preview.reconciliationShortfall).toBe(0);

    const lines = preview.fileContent!.split("\r\n");

    // CD 1 (Line 3): 1 deductee mapped
    const cd1 = lines[2]!.split(TDS_DELIMITER);
    expect(cd1[1]).toBe("CD");
    expect(cd1[3]).toBe("1"); // Challan Record 1
    expect(cd1[4]).toBe("1"); // Count of mapped deductees: 1

    // CD 2 (Line 4): 1 deductee mapped
    const cd2 = lines[3]!.split(TDS_DELIMITER);
    expect(cd2[1]).toBe("CD");
    expect(cd2[3]).toBe("2"); // Challan Record 2
    expect(cd2[4]).toBe("1"); // Count of mapped deductees: 1

    // DD 1 (Line 5): mapped to Challan 1
    const dd1 = lines[4]!.split(TDS_DELIMITER);
    expect(dd1[1]).toBe("DD");
    expect(dd1[3]).toBe("1"); // Linked to Challan 1

    // DD 2 (Line 6): mapped to Challan 2
    const dd2 = lines[5]!.split(TDS_DELIMITER);
    expect(dd2[1]).toBe("DD");
    expect(dd2[3]).toBe("2"); // Linked to Challan 2
  });

  test("Q4 Annual Salary Details incorporates previous employer salary and TDS", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Joined",
      lastName: "MidYear",
      email: "midyear@indiapay.com",
      pan: "MIDYR1234K",
    });

    await asAdmin.mutation(api.form138Tds.saveTdsChallan, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q4",
      bsrCode: "0210001",
      depositDate: "2027-02-07",
      challanSerialNumber: "00099",
      minorHead: "200",
      taxAmount: 20000,
    });

    await t.run(async (ctx: MutationCtx) => {
      // 3 months of salary with current employer in Q4
      const runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2027-01",
        startDate: "2027-01-01",
        endDate: "2027-01-31",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 300000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 20000,
        totalEmployerContributions: 0,
        totalNetSalary: 280000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
        basicSalary: 150000,
        allowances: [],
        grossSalary: 300000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          { name: "TDS", amount: 20000, isConfigured: true },
        ],
        totalStatutoryDeductions: 20000,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 20000,
        netSalary: 280000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });

      // Employee declares ₹5,00,000 previous employer gross and ₹25,000 TDS deducted
      await ctx.db.insert("taxDeclarations", {
        workspaceId: ws,
        employeeId: empId,
        financialYear: "2026-27",
        regime: "new",
        status: "approved",
        previousEmployer: {
          grossSalary: 500000,
          tdsDeducted: 25000,
          employerName: "Old Corp India",
          employerTan: "DELK99999A",
        },
        proofs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q4",
    });

    expect(preview.success).toBe(true);
    expect(preview.annualSalaryDetails.length).toBe(1);

    const s = preview.annualSalaryDetails[0]!;
    expect(s.employeeName).toBe("Joined MidYear");
    expect(s.previousEmployerGross).toBe(500000);
    expect(s.previousEmployerTds).toBe(25000);
    expect(s.annualGrossSalary).toBe(300000 + 500000); // 8,00,000 combined

    const lines = preview.fileContent!.split("\r\n");
    const sdLine = lines.find((l) => l.split(TDS_DELIMITER)[1] === "SD");
    expect(sdLine).toBeDefined();

    const sdParts = sdLine!.split(TDS_DELIMITER);
    expect(sdParts[1]).toBe("SD");
    expect(sdParts[4]).toBe("MIDYR1234K"); // PAN
    expect(sdParts[9]).toBe("300000.00"); // Current employer gross
    expect(sdParts[17]).toBe("500000.00"); // Prev employer gross
    expect(sdParts[27]).toBe("20000.00"); // Current employer TDS
    expect(sdParts[28]).toBe("25000.00"); // Prev employer TDS
  });

  test("Section 197 lower deduction certificate sets reason code A and 10-char certificate number in DD record", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedTdsWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Cert",
      lastName: "Holder",
      email: "cert@indiapay.com",
      pan: "CERTI1234K",
    });

    await t.run(async (ctx: MutationCtx) => {
      // Configure Section 197 Certificate
      await ctx.db.insert("employeeCompliance", {
        workspaceId: ws,
        employeeId: empId,
        taxRegime: "new",
        epfOptOut: false,
        section197CertificateNumber: "197CERT99A",
        section197Rate: 2.0,
        updatedAt: Date.now(),
      });

      // Add Challan
      await ctx.db.insert("tdsChallans", {
        workspaceId: ws,
        financialYear: "2026-27",
        quarter: "Q1",
        bsrCode: "0210001",
        depositDate: "2026-05-07",
        challanSerialNumber: "00012",
        minorHead: "200",
        taxAmount: 2000,
        totalAmount: 2000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Seed payroll run with lower 2% TDS
      const runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-04",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 100000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 2000,
        totalEmployerContributions: 0,
        totalNetSalary: 98000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
        basicSalary: 50000,
        allowances: [],
        grossSalary: 100000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          { name: "TDS", amount: 2000, isConfigured: true },
        ],
        totalStatutoryDeductions: 2000,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 2000,
        netSalary: 98000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.form138Tds.previewQuarterlyTds, {
      workspaceId: ws,
      financialYear: "2026-27",
      quarter: "Q1",
    });

    expect(preview.success).toBe(true);
    const lines = preview.fileContent!.split("\r\n");

    // BH Record field 53: Count of SD records is "0" in Q1
    const bhParts = lines[1]!.split(TDS_DELIMITER);
    expect(bhParts[52]).toBe("0"); // 53rd field (0-indexed 52)

    // DD Record: Reason code A and certificate number
    const ddParts = lines[3]!.split(TDS_DELIMITER);
    expect(ddParts[24]).toBe("A"); // Reason code A: Lower deduction u/s 197
    expect(ddParts[25]).toBe("197CERT99A"); // Certificate number
  });
});
