import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

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
        "./statutoryTds.ts": () => import("./statutoryTds"),
        "./professionalTax.ts": () => import("./professionalTax"),
        "./devAccounts.ts": () => import("./devAccounts"),
        "./devAccountsMutation.ts": () => import("./devAccountsMutation"),
        "./_generated/api.js": () => import("./_generated/api.js"),
        "./_generated/server.js": () => import("./_generated/server.js"),
      };

const as = (userId: string) => ({ subject: `${userId}|sess_${userId}` });

async function seedTestWorkspace(t: any) {
  let ws: any;
  let owner: any;
  let owner2: any;
  let admin: any;
  let member: any;
  let emp1: any;

  await t.run(async (ctx: any) => {
    owner = await ctx.db.insert("users", {
      name: "Primary Owner",
      email: "owner1@test.com",
    });
    owner2 = await ctx.db.insert("users", {
      name: "Secondary Owner",
      email: "owner2@test.com",
    });
    admin = await ctx.db.insert("users", {
      name: "Payroll Admin",
      email: "admin@test.com",
    });
    member = await ctx.db.insert("users", {
      name: "Staff Member",
      email: "staff@test.com",
    });

    ws = await ctx.db.insert("workspaces", {
      name: "Test Corp",
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
      userId: owner2,
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

    emp1 = await ctx.db.insert("employees", {
      workspaceId: ws,
      firstName: "Aarav",
      lastName: "Patel",
      email: "aarav@test.com",
      status: "active",
      userId: member,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create a regular processed run for October 2026
    const runId = await ctx.db.insert("payrollRuns", {
      workspaceId: ws,
      periodMonth: "2026-10",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      status: "processed",
      runType: "regular",
      totalEmployees: 1,
      totalGrossSalary: 50000,
      totalLopDeduction: 0,
      totalCustomDeductions: 0,
      totalStatutoryDeductions: 2000,
      totalNetSalary: 48000,
      createdById: admin,
      finalizedBy: owner,
      finalizedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("payrollItems", {
      workspaceId: ws,
      payrollRunId: runId,
      employeeId: emp1,
      basicSalary: 50000,
      allowances: [],
      grossSalary: 50000,
      lopDays: 0,
      lopDeduction: 0,
      customDeductions: [],
      totalCustomDeductions: 0,
      statutoryDeductions: [
        { name: "PF", amount: 1800, isConfigured: true },
        { name: "PT", amount: 200, isConfigured: true },
      ],
      totalStatutoryDeductions: 2000,
      employerContributions: [],
      totalEmployerContributions: 0,
      totalDeductions: 2000,
      netSalary: 48000,
      hasSalaryStructure: true,
      warnings: [],
      createdAt: Date.now(),
    });
  });

  return { ws, owner, owner2, admin, member, emp1 };
}

describe("Supplementary Payroll Workflow Suite", () => {
  test("Admin can create supplementary run against finalized regular run", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin, emp1 } = await seedTestWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const runs = await asAdmin.query(api.payroll.listRuns, { workspaceId: ws });
    const originalRun = runs[0];
    expect(originalRun.status).toBe("processed");

    const suppRunId = await asAdmin.mutation(
      api.payroll.createSupplementaryRun,
      {
        workspaceId: ws,
        originalPayrollRunId: originalRun._id,
        targetEmployeeId: emp1,
        adjustmentCategory: "missed_allowance",
        adjustmentReason:
          "Retroactive travel allowance reimbursement for October",
        grossAdjustment: 10000,
        taxDeduction: 1000,
      },
    );

    expect(suppRunId).toBeDefined();

    // Verify supplementary run details
    const runDetails = await asAdmin.query(api.payroll.getRunDetails, {
      workspaceId: ws,
      payrollRunId: suppRunId,
    });
    expect(runDetails.run.runType).toBe("supplementary");
    expect(runDetails.run.status).toBe("calculated");
    expect(runDetails.run.totalGrossSalary).toBe(10000);
    expect(runDetails.run.totalNetSalary).toBe(9000);
    expect(runDetails.run.totalStatutoryDeductions).toBe(1000);
    expect(runDetails.run.originalPayrollRunId).toBe(originalRun._id);
    expect(runDetails.items.length).toBe(1);
    expect(runDetails.items[0].netSalary).toBe(9000);

    // Verify original run remains completely unchanged!
    const originalRunAfter = await asAdmin.query(api.payroll.getRunDetails, {
      workspaceId: ws,
      payrollRunId: originalRun._id,
    });
    expect(originalRunAfter.run.totalGrossSalary).toBe(50000);
    expect(originalRunAfter.run.totalNetSalary).toBe(48000);
    expect(originalRunAfter.run.status).toBe("processed");
  });

  test("Duplicate prevention: Rejects second adjustment for same employee and category", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin, emp1 } = await seedTestWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const runs = await asAdmin.query(api.payroll.listRuns, { workspaceId: ws });
    const originalRun = runs[0];

    // First adjustment succeeds
    await asAdmin.mutation(api.payroll.createSupplementaryRun, {
      workspaceId: ws,
      originalPayrollRunId: originalRun._id,
      targetEmployeeId: emp1,
      adjustmentCategory: "retroactive_hike",
      adjustmentReason: "Annual appraisal adjustment for Oct",
      grossAdjustment: 5000,
    });

    // Second adjustment with identical category for same employee & original run MUST be rejected
    await expect(
      asAdmin.mutation(api.payroll.createSupplementaryRun, {
        workspaceId: ws,
        originalPayrollRunId: originalRun._id,
        targetEmployeeId: emp1,
        adjustmentCategory: "retroactive_hike",
        adjustmentReason: "Duplicate appraisal adjustment attempt",
        grossAdjustment: 5000,
      }),
    ).rejects.toThrow(/Duplicate adjustment rejected/);
  });

  test("Supplementary run creation rejected if original run is not processed (e.g. draft/calculated)", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin, emp1 } = await seedTestWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    // Create an unfinalized calculated run
    let draftRunId: any;
    await t.run(async (ctx: any) => {
      draftRunId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-11",
        startDate: "2026-11-01",
        endDate: "2026-11-30",
        status: "calculated",
        runType: "regular",
        totalEmployees: 1,
        totalGrossSalary: 50000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 2000,
        totalNetSalary: 48000,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    await expect(
      asAdmin.mutation(api.payroll.createSupplementaryRun, {
        workspaceId: ws,
        originalPayrollRunId: draftRunId,
        targetEmployeeId: emp1,
        adjustmentCategory: "bonus",
        adjustmentReason: "Should fail because original run is not processed",
        grossAdjustment: 5000,
      }),
    ).rejects.toThrow(
      /Cannot create supplementary run: Original run is in calculated status/,
    );
  });

  test("Maker-Checker rule strictly enforced on supplementary run approval", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner, owner2, admin, emp1 } = await seedTestWorkspace(t);
    const asOwner = t.withIdentity(as(owner));
    const asOwner2 = t.withIdentity(as(owner2));

    const runs = await asOwner.query(api.payroll.listRuns, { workspaceId: ws });
    const originalRun = runs[0];

    // Primary Owner creates supplementary run
    const suppRunId = await asOwner.mutation(
      api.payroll.createSupplementaryRun,
      {
        workspaceId: ws,
        originalPayrollRunId: originalRun._id,
        targetEmployeeId: emp1,
        adjustmentCategory: "retention_bonus",
        adjustmentReason: "Special retention bonus",
        grossAdjustment: 20000,
      },
    );

    // Primary Owner submits run for approval
    await asOwner.mutation(api.payroll.submitForApproval, {
      workspaceId: ws,
      payrollRunId: suppRunId,
    });

    // Primary Owner CANNOT approve their own run (Maker-Checker violation)
    await expect(
      asOwner.mutation(api.payroll.approveRun, {
        workspaceId: ws,
        payrollRunId: suppRunId,
      }),
    ).rejects.toThrow(
      /Maker-Checker violation|cannot approve a payroll run that you submitted/,
    );

    // Secondary Owner CAN approve it
    await asOwner2.mutation(api.payroll.approveRun, {
      workspaceId: ws,
      payrollRunId: suppRunId,
    });

    // Finalize the run
    await asOwner2.mutation(api.payroll.finalizeRun, {
      workspaceId: ws,
      payrollRunId: suppRunId,
    });

    const finalDetails = await asOwner.query(api.payroll.getRunDetails, {
      workspaceId: ws,
      payrollRunId: suppRunId,
    });
    expect(finalDetails.run.status).toBe("processed");
  });

  test("Financial isolation: Supplementary run does NOT inflate baseline dashboard monthly KPIs", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner, owner2, admin, emp1 } = await seedTestWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));
    const asOwner = t.withIdentity(as(owner));
    const asOwner2 = t.withIdentity(as(owner2));

    const runs = await asAdmin.query(api.payroll.listRuns, { workspaceId: ws });
    const originalRun = runs[0];

    // Baseline stats for October 2026: Gross ₹50,000, Net ₹48,000
    const statsBefore = await asOwner.query(api.dashboard.stats, {
      workspaceId: ws,
      periodMonth: "2026-10",
    });
    expect(statsBefore?.latestGrossPayroll).toBe(50000);
    expect(statsBefore?.latestNetPayroll).toBe(48000);
    expect(statsBefore?.supplementaryRunsCount).toBe(0);

    // Create, submit, approve, and finalize a supplementary run of ₹15,000
    const suppRunId = await asAdmin.mutation(
      api.payroll.createSupplementaryRun,
      {
        workspaceId: ws,
        originalPayrollRunId: originalRun._id,
        targetEmployeeId: emp1,
        adjustmentCategory: "arrears",
        adjustmentReason: "Arrears payout",
        grossAdjustment: 15000,
      },
    );
    await asAdmin.mutation(api.payroll.submitForApproval, {
      workspaceId: ws,
      payrollRunId: suppRunId,
    });
    await asOwner.mutation(api.payroll.approveRun, {
      workspaceId: ws,
      payrollRunId: suppRunId,
    });
    await asOwner.mutation(api.payroll.finalizeRun, {
      workspaceId: ws,
      payrollRunId: suppRunId,
    });

    // Stats check: Baseline regular gross/net MUST remain ₹50k / ₹48k (no double counting!)
    // Supplementary totals are reported separately
    const statsAfter = await asOwner.query(api.dashboard.stats, {
      workspaceId: ws,
      periodMonth: "2026-10",
    });
    expect(statsAfter?.latestGrossPayroll).toBe(50000);
    expect(statsAfter?.latestNetPayroll).toBe(48000);
    expect(statsAfter?.supplementaryRunsCount).toBe(1);
    expect(statsAfter?.supplementaryGrossTotal).toBe(15000);
    expect(statsAfter?.supplementaryNetTotal).toBe(15000);
  });

  test("RBAC: Regular member is forbidden from creating supplementary payroll runs", async () => {
    const t = convexTest(schema, modules);
    const { ws, member, emp1 } = await seedTestWorkspace(t);
    const asMember = t.withIdentity(as(member));

    const runs = await t.run(async (ctx: any) => {
      return await ctx.db
        .query("payrollRuns")
        .withIndex("by_workspace", (q: any) => q.eq("workspaceId", ws))
        .collect();
    });
    const originalRun = runs[0];

    await expect(
      asMember.mutation(api.payroll.createSupplementaryRun, {
        workspaceId: ws,
        originalPayrollRunId: originalRun._id,
        targetEmployeeId: emp1,
        adjustmentCategory: "hike",
        adjustmentReason: "Unauthorized",
        grossAdjustment: 10000,
      }),
    ).rejects.toThrow(/Forbidden/);
  });
});
