import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  ECR_DELIMITER,
  buildEcrRecord,
  calculateChallanAccounts,
  sanitizeMemberName,
  validateUanForEcr,
} from "./epfoEcr";
import schema from "./schema";

// biome-ignore lint/suspicious/noExplicitAny: convexTest modules map
const modules: Record<string, () => Promise<any>> =
  // biome-ignore lint/suspicious/noExplicitAny: glob import
  typeof (import.meta as any).glob === "function"
    ? // biome-ignore lint/suspicious/noExplicitAny: glob import
      (import.meta as any).glob(["./**/*.*s", "!./**/*.test.*"])
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
        "./declarations.ts": () => import("./declarations"),
        "./employees.ts": () => import("./employees"),
        "./epfoEcr.ts": () => import("./epfoEcr"),
        "./leaves.ts": () => import("./leaves"),
        "./lop.ts": () => import("./lop"),
        "./payroll.ts": () => import("./payroll"),
        "./salaries.ts": () => import("./salaries"),
        "./statutory.ts": () => import("./statutory"),
        "./statutoryTds.ts": () => import("./statutoryTds"),
        "./professionalTax.ts": () => import("./professionalTax"),
        "./lwf.ts": () => import("./lwf"),
        "./devAccounts.ts": () => import("./devAccounts"),
        "./devAccountsMutation.ts": () => import("./devAccountsMutation"),
        "./_generated/api.js": () => import("./_generated/api.js"),
        "./_generated/server.js": () => import("./_generated/server.js"),
      };

const as = (userId: string) => ({ subject: `${userId}|sess_${userId}` });

// biome-ignore lint/suspicious/noExplicitAny: test helper
async function seedEcrWorkspace(t: any) {
  let ws!: Id<"workspaces">;
  let owner!: Id<"users">;
  let admin!: Id<"users">;
  let member!: Id<"users">;

  await t.run(async (ctx: MutationCtx) => {
    owner = await ctx.db.insert("users", {
      name: "Owner User",
      email: "owner@indiapay.com",
      emailVerificationTime: Date.now(),
    });
    admin = await ctx.db.insert("users", {
      name: "Admin User",
      email: "admin@indiapay.com",
      emailVerificationTime: Date.now(),
    });
    member = await ctx.db.insert("users", {
      name: "Regular Member",
      email: "member@indiapay.com",
      emailVerificationTime: Date.now(),
    });

    ws = await ctx.db.insert("workspaces", {
      name: "IndiaPay EPFO Test Workspace",
      ownerId: owner,
      createdAt: Date.now(),
    });

    await ctx.db.insert("members", {
      workspaceId: ws,
      userId: owner,
      role: "owner",
      createdAt: Date.now(),
    });
    await ctx.db.insert("members", {
      workspaceId: ws,
      userId: admin,
      role: "admin",
      createdAt: Date.now(),
    });
    await ctx.db.insert("members", {
      workspaceId: ws,
      userId: member,
      role: "member",
      createdAt: Date.now(),
    });

    // Configure EPF compliance for workspace
    await ctx.db.insert("workspaceCompliance", {
      workspaceId: ws,
      epfEnabled: true,
      epfWageCeiling: 15000,
      epfRestrictToCeiling: true,
      epsEnabled: true,
      epsWageCeiling: 15000,
      edliEnabled: true,
      adminChargesEnabled: true,
      epfEstablishmentCode: "MHBAN0012345000",
      esiEnabled: false,
      ptEnabled: false,
      lwfEnabled: false,
      updatedAt: Date.now(),
    });
  });

  return { ws, owner, admin, member };
}

describe("EPFO ECR Unit & Pure Math Suite", () => {
  test("Field Ordering & Delimiter: formats exactly 11 fields separated by #~#", () => {
    const row = buildEcrRecord({
      uan: "100123456789",
      memberName: "Anjali Verma",
      grossWages: 50000,
      epfWages: 15000,
      epsWages: 15000,
      edliWages: 15000,
      eeShare: 1800,
      epsShare: 1250,
      erShare: 550,
      ncpDays: 2,
      refundOfAdvances: 0,
    });

    const parts = row.formattedLine.split(ECR_DELIMITER);
    expect(parts.length).toBe(11);
    expect(parts[0]).toBe("100123456789"); // 1. UAN
    expect(parts[1]).toBe("ANJALI VERMA"); // 2. Member Name (uppercase)
    expect(parts[2]).toBe("50000"); // 3. Gross Wages
    expect(parts[3]).toBe("15000"); // 4. EPF Wages
    expect(parts[4]).toBe("15000"); // 5. EPS Wages
    expect(parts[5]).toBe("15000"); // 6. EDLI Wages
    expect(parts[6]).toBe("1800"); // 7. EE Share (12%)
    expect(parts[7]).toBe("1250"); // 8. EPS Share (8.33%, capped ₹1,250)
    expect(parts[8]).toBe("550"); // 9. ER Share (1800 - 1250)
    expect(parts[9]).toBe("2"); // 10. NCP Days
    expect(parts[10]).toBe("0"); // 11. Refund of Advances
  });

  test("Member Name Sanitization: Strips #~# delimiter and newlines, keeps valid characters", () => {
    expect(sanitizeMemberName("John#~#Doe")).toBe("JOHNDOE");
    expect(sanitizeMemberName("O'Connor M. S.")).toBe("O'CONNOR M. S.");
    expect(sanitizeMemberName("Line1\nLine2\rLine3")).toBe("LINE1 LINE2 LINE3");
    expect(sanitizeMemberName("  rahul  sharma  ")).toBe("RAHUL SHARMA");
    expect(sanitizeMemberName("")).toBe("UNKNOWN");
  });

  test("UAN Validation: accepts exactly 12 numeric digits and rejects invalid formats", () => {
    expect(validateUanForEcr("100987654321", "Test Emp").valid).toBe(true);
    expect(validateUanForEcr("  100987654321  ", "Test Emp").valid).toBe(true);

    const missing = validateUanForEcr("", "Emp A");
    expect(missing.valid).toBe(false);
    expect(missing.error).toContain("missing a Universal Account Number");

    const undefinedUan = validateUanForEcr(undefined, "Emp B");
    expect(undefinedUan.valid).toBe(false);

    const tooShort = validateUanForEcr("123456789", "Emp C");
    expect(tooShort.valid).toBe(false);
    expect(tooShort.error).toContain("must be exactly 12 numeric digits");

    const letters = validateUanForEcr("10012345678A", "Emp D");
    expect(letters.valid).toBe(false);
  });

  test("Statutory Rounding & Mathematical Balance: EE_SHARE = EPS_SHARE + ER_SHARE", () => {
    // Standard capped wage
    const capped = buildEcrRecord({
      uan: "100111222333",
      memberName: "Standard Capped",
      grossWages: 25000,
      epfWages: 15000,
      epsWages: 15000,
      edliWages: 15000,
      eeShare: 1800,
      epsShare: 1250,
      erShare: 550,
      ncpDays: 0,
    });
    expect(capped.eeShare).toBe(capped.epsShare + capped.erShare);

    // Below wage ceiling (e.g. basic = 12000)
    // 12% = 1440; 8.33% = 1000; ER = 440
    const belowCeiling = buildEcrRecord({
      uan: "100444555666",
      memberName: "Below Ceiling",
      grossWages: 12000,
      epfWages: 12000,
      epsWages: 12000,
      edliWages: 12000,
      eeShare: 1440,
      epsShare: 1000,
      erShare: 440,
      ncpDays: 0,
    });
    expect(belowCeiling.eeShare).toBe(
      belowCeiling.epsShare + belowCeiling.erShare,
    );
  });

  test("Zero Values & Full Month LOP: NCP days = 30 with 0 wages and 0 contributions", () => {
    const zeroRow = buildEcrRecord({
      uan: "100777888999",
      memberName: "Unpaid Full Month",
      grossWages: 0,
      epfWages: 0,
      epsWages: 0,
      edliWages: 0,
      eeShare: 0,
      epsShare: 0,
      erShare: 0,
      ncpDays: 30,
    });

    const parts = zeroRow.formattedLine.split(ECR_DELIMITER);
    expect(parts[2]).toBe("0"); // Gross
    expect(parts[3]).toBe("0"); // EPF
    expect(parts[6]).toBe("0"); // EE Share
    expect(parts[7]).toBe("0"); // EPS Share
    expect(parts[8]).toBe("0"); // ER Share
    expect(parts[9]).toBe("30"); // NCP Days
  });

  test("Challan Reconciliation: Account 1, Account 2 (Admin min ₹500), Account 10, Account 21 (EDLI 0.50%)", () => {
    // 2 employees with EPF wages: ₹15,000 + ₹12,000 = ₹27,000
    // Total EE Share: 1800 + 1440 = 3240
    // Total EPS Share: 1250 + 1000 = 2250
    // Total ER Share: 550 + 440 = 990
    // A/c 1 Total = 3240 + 990 = 4230
    // A/c 2: 0.5% of 27,000 = 135 -> Statutory min applied = 500!
    // A/c 10: 2250
    // A/c 21: 0.5% of 27,000 = 135 (no floor; historical ₹200 was for A/c 22 admin)
    // A/c 22: Waived (0)
    // Total Remittance: 4230 + 500 + 2250 + 135 = 7115

    const challan = calculateChallanAccounts(
      27000, // Total EPF wages
      27000, // Total EDLI wages
      3240, // EE Share
      2250, // EPS Share
      990, // ER Share
      true, // Admin charges enabled
      true, // EDLI enabled
    );

    expect(challan.account1.total).toBe(4230);
    expect(challan.account1.eeShare).toBe(3240);
    expect(challan.account1.erShare).toBe(990);

    expect(challan.account2.calculatedAmount).toBe(135);
    expect(challan.account2.minimumApplied).toBe(true);
    expect(challan.account2.total).toBe(500);

    expect(challan.account10.total).toBe(2250);

    expect(challan.account21.calculatedAmount).toBe(135);
    expect(challan.account21.total).toBe(135);

    expect(challan.account22.total).toBe(0);
    expect(challan.totalRemittance).toBe(4230 + 500 + 2250 + 135);
  });

  test("Challan Reconciliation: High Wage exceeding statutory minimums", () => {
    // 100 employees, Total EPF wages = ₹15,00,000
    // Admin charges: 0.5% of 15,00,000 = 7,500 (> ₹500, min not applied)
    // EDLI: 0.5% of 15,00,000 = 7,500

    const challan = calculateChallanAccounts(
      1500000,
      1500000,
      180000,
      125000,
      55000,
      true,
      true,
    );

    expect(challan.account2.total).toBe(7500);
    expect(challan.account2.minimumApplied).toBe(false);

    expect(challan.account21.total).toBe(7500);
  });
});

describe("EPFO ECR Convex Workflow & Security Suite", () => {
  test("Admin can preview and generate clean EPFO ECR export from finalized payroll run", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedEcrWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    // Create 2 employees with valid UANs
    const emp1Id = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Suresh",
      lastName: "Rao",
      email: "suresh.rao@indiapay.com",
      uan: "100111222333",
      pfMemberId: "MHBAN00123450000000001",
    });

    const emp2Id = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Deepa",
      lastName: "Nair",
      email: "deepa.nair@indiapay.com",
      uan: "100444555666",
      pfMemberId: "MHBAN00123450000000002",
    });

    // Create finalized payroll run
    let runId!: Id<"payrollRuns">;
    await t.run(async (ctx: MutationCtx) => {
      runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "processed",
        totalEmployees: 2,
        totalGrossSalary: 110000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 3600,
        totalEmployerContributions: 4000,
        totalNetSalary: 106400,
        createdById: admin,
        submittedBy: admin,
        finalizedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Employee 1: Basic 40,000 (Gross 60,000), capped EPF wages 15,000, LOP 1 day
      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: emp1Id,
        basicSalary: 40000,
        allowances: [],
        grossSalary: 60000,
        lopDays: 1,
        lopDeduction: 2000,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          {
            name: "PF (Provident Fund - 12%)",
            amount: 1800,
            isConfigured: true,
          },
        ],
        totalStatutoryDeductions: 1800,
        employerContributions: [
          {
            name: "Employer EPF (3.67% share)",
            amount: 550,
            isConfigured: true,
          },
          {
            name: "Employer EPS (8.33% Pension)",
            amount: 1250,
            isConfigured: true,
          },
          { name: "EDLI (0.5% Insurance)", amount: 75, isConfigured: true },
          { name: "EPFO Admin Charges (0.5%)", amount: 75, isConfigured: true },
        ],
        totalEmployerContributions: 1950,
        totalDeductions: 3800,
        netSalary: 56200,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });

      // Employee 2: Basic 15,000 (Gross 50,000), EPF wages 15,000, LOP 0
      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: emp2Id,
        basicSalary: 15000,
        allowances: [],
        grossSalary: 50000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          {
            name: "PF (Provident Fund - 12%)",
            amount: 1800,
            isConfigured: true,
          },
        ],
        totalStatutoryDeductions: 1800,
        employerContributions: [
          {
            name: "Employer EPF (3.67% share)",
            amount: 550,
            isConfigured: true,
          },
          {
            name: "Employer EPS (8.33% Pension)",
            amount: 1250,
            isConfigured: true,
          },
          { name: "EDLI (0.5% Insurance)", amount: 75, isConfigured: true },
          { name: "EPFO Admin Charges (0.5%)", amount: 75, isConfigured: true },
        ],
        totalEmployerContributions: 1950,
        totalDeductions: 1800,
        netSalary: 48200,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.epfoEcr.previewEpfoEcrExport, {
      workspaceId: ws,
      payrollRunId: runId,
    });

    expect(preview.success).toBe(true);
    expect(preview.errors.length).toBe(0);
    expect(preview.totalRecords).toBe(2);
    expect(preview.fileName).toBe("EPFO_ECR_2026-10_MHBAN0012345000.txt");

    // Verify summary totals
    expect(preview.summary?.totalGrossWages).toBe(108000); // 58,000 (after 2,000 LOP) + 50,000
    expect(preview.summary?.totalEpfWages).toBe(30000);
    expect(preview.summary?.totalEpsWages).toBe(30000);
    expect(preview.summary?.totalEeShare).toBe(3600);
    expect(preview.summary?.totalEpsShare).toBe(2500);
    expect(preview.summary?.totalErShare).toBe(1100);
    expect(preview.summary?.totalNcpDays).toBe(1);

    // Verify Challan Reconciliation
    expect(preview.summary?.challanAccounts.account1.total).toBe(4700); // 3600 EE + 1100 ER
    expect(preview.summary?.challanAccounts.account2.total).toBe(500); // Statutory minimum applied
    expect(preview.summary?.challanAccounts.account10.total).toBe(2500);
    expect(preview.summary?.challanAccounts.account21.total).toBe(150); // 0.50% of ₹30,000 EDLI wages (no floor)
    expect(preview.summary?.challanAccounts.totalRemittance).toBe(
      4700 + 500 + 2500 + 150,
    );

    // Verify file content formatting
    expect(preview.fileContent).toBeDefined();
    const lines = preview.fileContent!.split("\n");
    expect(lines.length).toBe(2);

    expect(lines[0]).toBe(
      "100111222333#~#SURESH RAO#~#58000#~#15000#~#15000#~#15000#~#1800#~#1250#~#550#~#1#~#0",
    );
    expect(lines[1]).toBe(
      "100444555666#~#DEEPA NAIR#~#50000#~#15000#~#15000#~#15000#~#1800#~#1250#~#550#~#0#~#0",
    );

    // Admin downloads and audits export
    await asAdmin.mutation(api.epfoEcr.logEcrDownload, {
      workspaceId: ws,
      payrollRunId: runId,
      totalMembers: preview.summary!.totalMembers,
      totalRemittance: preview.summary!.challanAccounts.totalRemittance,
    });
  });

  test("Actionable Validation: Missing UAN blocks file generation and identifies employee", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedEcrWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    // Employee WITHOUT UAN
    const empNoUanId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Kavita",
      lastName: "Iyer",
      email: "kavita.iyer@indiapay.com",
      // uan omitted!
    });

    let runId!: Id<"payrollRuns">;
    await t.run(async (ctx: MutationCtx) => {
      runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 45000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 1800,
        totalEmployerContributions: 1950,
        totalNetSalary: 43200,
        createdById: admin,
        submittedBy: admin,
        finalizedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empNoUanId,
        basicSalary: 30000,
        allowances: [],
        grossSalary: 45000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          {
            name: "PF (Provident Fund - 12%)",
            amount: 1800,
            isConfigured: true,
          },
        ],
        totalStatutoryDeductions: 1800,
        employerContributions: [
          {
            name: "Employer EPF (3.67% share)",
            amount: 550,
            isConfigured: true,
          },
          {
            name: "Employer EPS (8.33% Pension)",
            amount: 1250,
            isConfigured: true,
          },
        ],
        totalEmployerContributions: 1800,
        totalDeductions: 1800,
        netSalary: 43200,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.epfoEcr.previewEpfoEcrExport, {
      workspaceId: ws,
      payrollRunId: runId,
    });

    expect(preview.success).toBe(false);
    expect(preview.fileContent).toBeNull();
    expect(preview.errors.length).toBe(1);
    expect(preview.errors[0]).toContain("Kavita Iyer");
    expect(preview.errors[0]).toContain(
      "missing a Universal Account Number (UAN)",
    );
  });

  test("Actionable Validation: Malformed UAN blocks export with specific error message", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedEcrWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    // Legacy Employee record directly in DB with 10-digit UAN
    let empBadUanId!: Id<"employees">;
    await t.run(async (ctx: MutationCtx) => {
      empBadUanId = await ctx.db.insert("employees", {
        workspaceId: ws,
        firstName: "Vikram",
        lastName: "Seth",
        email: "vikram.seth@indiapay.com",
        status: "active",
        uan: "1234567890", // only 10 digits in legacy record
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    let runId!: Id<"payrollRuns">;
    await t.run(async (ctx: MutationCtx) => {
      runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 30000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 1800,
        totalEmployerContributions: 1800,
        totalNetSalary: 28200,
        createdById: admin,
        submittedBy: admin,
        finalizedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empBadUanId,
        basicSalary: 20000,
        allowances: [],
        grossSalary: 30000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          {
            name: "PF (Provident Fund - 12%)",
            amount: 1800,
            isConfigured: true,
          },
        ],
        totalStatutoryDeductions: 1800,
        employerContributions: [
          {
            name: "Employer EPF (3.67% share)",
            amount: 550,
            isConfigured: true,
          },
          {
            name: "Employer EPS (8.33% Pension)",
            amount: 1250,
            isConfigured: true,
          },
        ],
        totalEmployerContributions: 1800,
        totalDeductions: 1800,
        netSalary: 28200,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.epfoEcr.previewEpfoEcrExport, {
      workspaceId: ws,
      payrollRunId: runId,
    });

    expect(preview.success).toBe(false);
    expect(preview.fileContent).toBeNull();
    expect(preview.errors[0]).toContain("Vikram Seth");
    expect(preview.errors[0]).toContain('invalid UAN "1234567890"');
  });

  test("Security & RBAC: Regular member is strictly forbidden from generating ECR export", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin, member } = await seedEcrWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));
    const asMember = t.withIdentity(as(member));

    let runId!: Id<"payrollRuns">;
    await t.run(async (ctx: MutationCtx) => {
      runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "processed",
        totalEmployees: 0,
        totalGrossSalary: 0,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 0,
        totalEmployerContributions: 0,
        totalNetSalary: 0,
        createdById: admin,
        submittedBy: admin,
        finalizedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      asMember.query(api.epfoEcr.previewEpfoEcrExport, {
        workspaceId: ws,
        payrollRunId: runId,
      }),
    ).rejects.toThrow("Forbidden");

    await expect(
      asMember.mutation(api.epfoEcr.logEcrDownload, {
        workspaceId: ws,
        payrollRunId: runId,
        totalMembers: 0,
        totalRemittance: 0,
      }),
    ).rejects.toThrow("Forbidden");
  });

  test("Workflow validation: Unprocessed/Draft run is rejected", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedEcrWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    let draftRunId!: Id<"payrollRuns">;
    await t.run(async (ctx: MutationCtx) => {
      draftRunId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "draft", // draft state!
        totalEmployees: 0,
        totalGrossSalary: 0,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 0,
        totalEmployerContributions: 0,
        totalNetSalary: 0,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.epfoEcr.previewEpfoEcrExport, {
      workspaceId: ws,
      payrollRunId: draftRunId,
    });

    expect(preview.success).toBe(false);
    expect(preview.isFinalized).toBe(false);
    expect(preview.errors[0]).toContain(
      "requires a finalized and processed payroll run",
    );
  });

  test("Full-month LOP employee in processed run emits 0 wages, 0 contributions, and exact NCP days", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedEcrWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Neha",
      lastName: "Kapoor",
      email: "neha.kapoor@indiapay.com",
      uan: "100999000111",
    });

    let runId!: Id<"payrollRuns">;
    await t.run(async (ctx: MutationCtx) => {
      runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-06",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 0,
        totalLopDeduction: 40000,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 0,
        totalEmployerContributions: 0,
        totalNetSalary: 0,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
        basicSalary: 20000,
        allowances: [],
        grossSalary: 40000,
        lopDays: 30,
        lopDeduction: 40000, // Full month unpaid leave
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [],
        totalStatutoryDeductions: 0,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 40000,
        netSalary: 0,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.epfoEcr.previewEpfoEcrExport, {
      workspaceId: ws,
      payrollRunId: runId,
    });

    expect(preview.success).toBe(true);
    expect(preview.summary?.totalGrossWages).toBe(0);
    expect(preview.summary?.totalEpfWages).toBe(0);
    expect(preview.summary?.totalEeShare).toBe(0);
    expect(preview.summary?.totalEpsShare).toBe(0);
    expect(preview.summary?.totalErShare).toBe(0);
    expect(preview.summary?.totalNcpDays).toBe(30);

    const line = preview.fileContent!.trim();
    expect(line).toBe(
      "100999000111#~#NEHA KAPOOR#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#30#~#0",
    );
  });

  test("Voluntary PF on full basic exceeding ₹15,000 cap maintains EE = EPS + ER exact balance", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedEcrWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Deepak",
      lastName: "Singhania",
      email: "deepak@indiapay.com",
      uan: "100888777666",
    });

    // Configure voluntary PF on full basic
    await asAdmin.mutation(api.compliance.updateEmployeeCompliance, {
      workspaceId: ws,
      employeeId: empId,
      taxRegime: "new",
      epfOptOut: false,
      epfOnActualBasic: true,
    });

    let runId!: Id<"payrollRuns">;
    await t.run(async (ctx: MutationCtx) => {
      runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-07",
        startDate: "2026-07-01",
        endDate: "2026-07-31",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 60000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 3600,
        totalEmployerContributions: 3600,
        totalNetSalary: 56400,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
        basicSalary: 30000,
        allowances: [{ name: "HRA", amount: 30000 }],
        grossSalary: 60000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          {
            name: "PF (Provident Fund - 12%)",
            amount: 3600,
            isConfigured: true,
          },
        ],
        totalStatutoryDeductions: 3600,
        employerContributions: [
          {
            name: "Employer EPF (3.67% share)",
            amount: 2350,
            isConfigured: true,
          },
          {
            name: "Employer EPS (8.33% Pension)",
            amount: 1250,
            isConfigured: true,
          },
        ],
        totalEmployerContributions: 3600,
        totalDeductions: 3600,
        netSalary: 56400,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.epfoEcr.previewEpfoEcrExport, {
      workspaceId: ws,
      payrollRunId: runId,
    });

    expect(preview.success).toBe(true);
    const line = preview.fileContent!.trim();
    const parts = line.split("#~#");

    // Exact field audit:
    // 1: UAN
    expect(parts[0]).toBe("100888777666");
    // 2: Member Name
    expect(parts[1]).toBe("DEEPAK SINGHANIA");
    // 3: Gross Wages
    expect(parts[2]).toBe("60000");
    // 4: EPF Wages (Voluntary full basic)
    expect(parts[3]).toBe("30000");
    // 5: EPS Wages (Statutorily capped at 15000)
    expect(parts[4]).toBe("15000");
    // 6: EDLI Wages (Statutorily capped at 15000)
    expect(parts[5]).toBe("15000");
    // 7: EE Share (12% of 30,000 = 3600)
    expect(parts[6]).toBe("3600");
    // 8: EPS Share (8.33% of 15,000 = 1250, capped)
    expect(parts[7]).toBe("1250");
    // 9: ER Share (EE - EPS = 3600 - 1250 = 2350)
    expect(parts[8]).toBe("2350");
    // 10: NCP Days
    expect(parts[9]).toBe("0");
    // 11: Refund of Advances
    expect(parts[10]).toBe("0");

    // Math identity verified
    expect(Number(parts[6])).toBe(Number(parts[7]) + Number(parts[8]));
  });

  test("Partial LOP on basic salary below statutory ceiling adjusts wages and preserves EE = EPS + ER exact balance", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin } = await seedEcrWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya@indiapay.com",
      uan: "100777666555",
    });

    let runId!: Id<"payrollRuns">;
    await t.run(async (ctx: MutationCtx) => {
      runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-08",
        startDate: "2026-08-01",
        endDate: "2026-08-31",
        status: "processed",
        totalEmployees: 1,
        totalGrossSalary: 12000,
        totalLopDeduction: 4000,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 1440,
        totalEmployerContributions: 1440,
        totalNetSalary: 6560,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Employee took 10 days unpaid leave:
      // Gross: 12,000, LOP deduction: 4,000 -> Earned gross: 8,000
      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
        basicSalary: 12000,
        allowances: [],
        grossSalary: 12000,
        lopDays: 10,
        lopDeduction: 4000,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          {
            name: "PF (Provident Fund - 12%)",
            amount: 1440,
            isConfigured: true,
          },
        ],
        totalStatutoryDeductions: 1440,
        employerContributions: [
          {
            name: "Employer EPF (3.67% share)",
            amount: 440,
            isConfigured: true,
          },
          {
            name: "Employer EPS (8.33% Pension)",
            amount: 1000,
            isConfigured: true,
          },
        ],
        totalEmployerContributions: 1440,
        totalDeductions: 5440,
        netSalary: 6560,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
    });

    const preview = await asAdmin.query(api.epfoEcr.previewEpfoEcrExport, {
      workspaceId: ws,
      payrollRunId: runId,
    });

    expect(preview.success).toBe(true);
    const line = preview.fileContent!.trim();
    const parts = line.split("#~#");

    // Exact audit:
    expect(parts[0]).toBe("100777666555");
    expect(parts[1]).toBe("PRIYA SHARMA");
    expect(parts[2]).toBe("8000"); // Earned Gross
    expect(parts[3]).toBe("8000"); // EPF Wages = Earned Basic
    expect(parts[4]).toBe("8000"); // EPS Wages
    expect(parts[5]).toBe("8000"); // EDLI Wages
    expect(parts[6]).toBe("960"); // EE Share = 12% of 8,000
    expect(parts[7]).toBe("666"); // EPS Share = Math.round(8,000 * 0.0833) = 666
    expect(parts[8]).toBe("294"); // ER Share = 960 - 666 = 294
    expect(parts[9]).toBe("10"); // NCP Days
    expect(parts[10]).toBe("0"); // Refund of Advances

    // Mathematical balance check
    expect(Number(parts[6])).toBe(Number(parts[7]) + Number(parts[8]));
  });
});
