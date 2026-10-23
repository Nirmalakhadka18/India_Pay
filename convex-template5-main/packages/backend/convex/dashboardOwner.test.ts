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
        "./declarations.ts": () => import("./declarations"),
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

async function seedOwnerDashboardWorkspace(t: any) {
  let ws: any;
  let owner1: any;
  let owner2: any;
  let admin: any;
  let emp1: any;
  let emp2: any;
  let emp3: any;

  await t.run(async (ctx: any) => {
    owner1 = await ctx.db.insert("users", {
      name: "Primary Owner",
      email: "owner1@indiapay.com",
    });
    owner2 = await ctx.db.insert("users", {
      name: "Secondary Owner",
      email: "owner2@indiapay.com",
    });
    admin = await ctx.db.insert("users", {
      name: "HR Admin",
      email: "admin@indiapay.com",
    });

    ws = await ctx.db.insert("workspaces", {
      name: "IndiaPay Corp",
      ownerId: owner1,
      createdAt: Date.now(),
    });

    await ctx.db.insert("members", {
      workspaceId: ws,
      userId: owner1,
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

    // 3 active employees
    emp1 = await ctx.db.insert("employees", {
      workspaceId: ws,
      firstName: "Aarav",
      lastName: "Sharma",
      email: "aarav@indiapay.com",
      department: "Engineering",
      designation: "Staff Engineer",
      status: "active",
      createdAt: Date.now() - 60 * 86400 * 1000,
      updatedAt: Date.now(),
    });

    emp2 = await ctx.db.insert("employees", {
      workspaceId: ws,
      firstName: "Neha",
      lastName: "Verma",
      email: "neha@indiapay.com",
      department: "Design",
      designation: "Product Designer",
      status: "active",
      createdAt: Date.now() - 40 * 86400 * 1000,
      updatedAt: Date.now(),
    });

    emp3 = await ctx.db.insert("employees", {
      workspaceId: ws,
      firstName: "Rohan",
      lastName: "Gupta",
      email: "rohan@indiapay.com",
      department: "Marketing",
      designation: "Growth Lead",
      status: "active",
      createdAt: Date.now(), // Joined recently after October finalized run
      updatedAt: Date.now(),
    });

    // Setup workspace compliance
    await ctx.db.insert("workspaceCompliance", {
      workspaceId: ws,
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
      updatedAt: Date.now(),
    });

    // Finalized regular run for October 2026 (includes emp1 and emp2, but NOT emp3)
    const runOct = await ctx.db.insert("payrollRuns", {
      workspaceId: ws,
      periodMonth: "2026-10",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      status: "processed",
      runType: "regular",
      totalEmployees: 2,
      totalGrossSalary: 100000,
      totalLopDeduction: 0,
      totalCustomDeductions: 0,
      totalStatutoryDeductions: 6000,
      totalEmployerContributions: 4000,
      totalNetSalary: 94000,
      createdById: admin,
      finalizedBy: owner1,
      finalizedAt: Date.now() - 5 * 86400 * 1000,
      createdAt: Date.now() - 10 * 86400 * 1000,
      updatedAt: Date.now(),
    });

    // Payroll items for October run
    await ctx.db.insert("payrollItems", {
      workspaceId: ws,
      payrollRunId: runOct,
      employeeId: emp1,
      basicSalary: 30000,
      allowances: [],
      grossSalary: 50000,
      lopDays: 0,
      lopDeduction: 0,
      customDeductions: [],
      totalCustomDeductions: 0,
      statutoryDeductions: [
        { name: "EPF", amount: 1800, isConfigured: true },
        { name: "ESI", amount: 375, isConfigured: true },
        { name: "TDS", amount: 625, isConfigured: true },
        { name: "Professional Tax", amount: 200, isConfigured: true },
      ],
      totalStatutoryDeductions: 3000,
      employerContributions: [
        { name: "EPF", amount: 1800, isConfigured: true },
        { name: "ESI", amount: 200, isConfigured: true },
      ],
      totalEmployerContributions: 2000,
      totalDeductions: 3000,
      netSalary: 47000,
      hasSalaryStructure: true,
      warnings: [],
      createdAt: Date.now(),
    });

    await ctx.db.insert("payrollItems", {
      workspaceId: ws,
      payrollRunId: runOct,
      employeeId: emp2,
      basicSalary: 30000,
      allowances: [],
      grossSalary: 50000,
      lopDays: 0,
      lopDeduction: 0,
      customDeductions: [],
      totalCustomDeductions: 0,
      statutoryDeductions: [
        { name: "EPF", amount: 1800, isConfigured: true },
        { name: "ESI", amount: 375, isConfigured: true },
        { name: "TDS", amount: 625, isConfigured: true },
        { name: "Professional Tax", amount: 200, isConfigured: true },
      ],
      totalStatutoryDeductions: 3000,
      employerContributions: [
        { name: "EPF", amount: 1800, isConfigured: true },
        { name: "ESI", amount: 200, isConfigured: true },
      ],
      totalEmployerContributions: 2000,
      totalDeductions: 3000,
      netSalary: 47000,
      hasSalaryStructure: true,
      warnings: [],
      createdAt: Date.now(),
    });

    // Add an audit log entry
    await ctx.db.insert("auditLogs", {
      workspaceId: ws,
      userId: owner1,
      action: "payroll_run_finalized",
      meta: { periodMonth: "2026-10", totalGross: 100000 },
      at: Date.now() - 5 * 86400 * 1000,
    });
  });

  return { ws, owner1, owner2, admin, emp1, emp2, emp3 };
}

describe("Owner Dashboard Executive Intelligence & Security", () => {
  test("1. Financial Overview returns accurate gross, net, deductions, and employer contributions", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner1 } = await seedOwnerDashboardWorkspace(t);

    const summary = await t
      .withIdentity(as(owner1))
      .query(api.dashboard.ownerExecutiveSummary, {
        workspaceId: ws,
        periodMonth: "2026-10",
      });

    expect(summary).toBeDefined();
    expect(summary.isOwner).toBe(true);

    const fin = summary.financialOverview;
    expect(fin.selectedPeriod).toBe("2026-10");
    expect(fin.status).toBe("processed");
    expect(fin.gross).toBe(100000);
    expect(fin.net).toBe(94000);
    expect(fin.employeeDeductions).toBe(6000);
    expect(fin.employerContributions).toBe(4000);
    expect(fin.totalCompanyCost).toBe(104000);
    expect(fin.employeesCount).toBe(2);

    // Breakdown checks
    expect(fin.breakdown.epf).toBe(3600); // 1800 * 2
    expect(fin.breakdown.esi).toBe(750); // 375 * 2
    expect(fin.breakdown.tds).toBe(1250); // 625 * 2
    expect(fin.breakdown.pt).toBe(400); // 200 * 2
    expect(fin.breakdown.employerEpf).toBe(3600);
    expect(fin.breakdown.employerEsi).toBe(400);
  });

  test("2. Workforce Reconciliation accurately identifies unincluded active employees", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner1, emp3 } = await seedOwnerDashboardWorkspace(t);

    const summary = await t
      .withIdentity(as(owner1))
      .query(api.dashboard.ownerExecutiveSummary, {
        workspaceId: ws,
        periodMonth: "2026-10",
      });

    const recon = summary.workforceReconciliation;
    expect(recon.activeEmployeesCount).toBe(3);
    expect(recon.finalizedEmployeesCount).toBe(2);
    expect(recon.difference).toBe(1);
    expect(recon.hasVariance).toBe(true);

    // Identifies Rohan Gupta (emp3) as the unincluded employee
    expect(recon.unincludedEmployees.length).toBe(1);
    expect(recon.unincludedEmployees[0]._id).toBe(emp3);
    expect(recon.unincludedEmployees[0].name).toBe("Rohan Gupta");
    expect(recon.auditExplanation).toContain(
      "1 active employee(s) joined or were registered",
    );
  });

  test("3. Statutory Compliance reports real backend rates and official filing deadlines", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner1 } = await seedOwnerDashboardWorkspace(t);

    const summary = await t
      .withIdentity(as(owner1))
      .query(api.dashboard.ownerExecutiveSummary, {
        workspaceId: ws,
        periodMonth: "2026-10",
      });

    const comp = summary.statutoryCompliance;
    expect(comp.epf.enabled).toBe(true);
    expect(comp.epf.wageCeiling).toBe(15000);
    expect(comp.epf.periodDeduction).toBe(3600);
    expect(comp.epf.filingDeadline).toContain("15-11-2026");
    expect(comp.epf.jurisdiction).toBe("Central (EPFO)");

    expect(comp.esi.enabled).toBe(true);
    expect(comp.esi.wageCeiling).toBe(21000);
    expect(comp.esi.periodDeduction).toBe(750);
    expect(comp.esi.filingDeadline).toContain("15-11-2026");
    expect(comp.esi.jurisdiction).toBe("Central (ESIC)");

    expect(comp.tds.enabled).toBe(true);
    expect(comp.tds.periodDeduction).toBe(1250);
    expect(comp.tds.challanDeadline).toContain("07-11-2026");
    expect(comp.tds.returnDeadline).toContain("31-01-2027"); // Q3 Form 24Q
    expect(comp.tds.jurisdiction).toBe("Central (CBDT)");

    expect(comp.pt.enabled).toBe(true);
    expect(comp.pt.state).toBe("Karnataka");
    expect(comp.pt.periodDeduction).toBe(400);
    expect(comp.pt.filingDeadline).toContain("20-11-2026");
    expect(comp.pt.jurisdiction).toContain("State Jurisdiction (Karnataka)");
  });

  test("4. Approval access: Submitter admin has full access to approve pending run", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner1, owner2, admin } = await seedOwnerDashboardWorkspace(t);

    // Create a run pending approval submitted by Owner 1
    await t.run(async (ctx: any) => {
      await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-11",
        startDate: "2026-11-01",
        endDate: "2026-11-30",
        status: "pending_approval",
        runType: "regular",
        totalEmployees: 3,
        totalGrossSalary: 150000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 9000,
        totalEmployerContributions: 6000,
        totalNetSalary: 141000,
        createdById: admin,
        submittedBy: owner1,
        submittedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // When Owner 1 queries summary, they are marked as submitter and CAN approve with full admin access
    const summaryOwner1 = await t
      .withIdentity(as(owner1))
      .query(api.dashboard.ownerExecutiveSummary, {
        workspaceId: ws,
        periodMonth: "2026-11",
      });

    const pendingO1 = summaryOwner1.payrollApprovals.pendingRuns[0];
    expect(pendingO1.isSubmitter).toBe(true);
    expect(pendingO1.canApprove).toBe(true);

    // When Owner 2 queries summary, they also CAN approve
    const summaryOwner2 = await t
      .withIdentity(as(owner2))
      .query(api.dashboard.ownerExecutiveSummary, {
        workspaceId: ws,
        periodMonth: "2026-11",
      });

    const pendingO2 = summaryOwner2.payrollApprovals.pendingRuns[0];
    expect(pendingO2.isSubmitter).toBe(false);
    expect(pendingO2.canApprove).toBe(true);
  });

  test("5. Supplementary adjustments are segregated and prevent duplicate baseline counting", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner1, emp1 } = await seedOwnerDashboardWorkspace(t);

    // Add a supplementary run
    await t.run(async (ctx: any) => {
      await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "processed",
        runType: "supplementary",
        targetEmployeeId: emp1,
        adjustmentReason: "Retroactive DA hike",
        adjustmentCategory: "retroactive_salary",
        totalEmployees: 1,
        totalGrossSalary: 5000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 0,
        totalNetSalary: 5000,
        createdById: owner1,
        finalizedBy: owner1,
        finalizedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const summary = await t
      .withIdentity(as(owner1))
      .query(api.dashboard.ownerExecutiveSummary, {
        workspaceId: ws,
        periodMonth: "2026-10",
      });

    // Regular baseline Gross remains ₹100,000 (not distorted to ₹105,000)
    expect(summary.financialOverview.gross).toBe(100000);

    // Supplementary is cleanly segregated
    expect(summary.supplementaryPayroll.count).toBe(1);
    expect(summary.supplementaryPayroll.grossTotal).toBe(5000);
    expect(summary.supplementaryPayroll.netTotal).toBe(5000);
    expect(summary.supplementaryPayroll.runs[0].targetEmployeeName).toBe(
      "Aarav Sharma",
    );
    expect(summary.supplementaryPayroll.runs[0].adjustmentReason).toBe(
      "Retroactive DA hike",
    );
  });

  test("6. Audit activity returns enriched actor identity with name and email", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner1 } = await seedOwnerDashboardWorkspace(t);

    const recentAudit = await t
      .withIdentity(as(owner1))
      .query(api.audit.recent, { workspaceId: ws });

    expect(recentAudit.length).toBeGreaterThan(0);
    expect(recentAudit[0].userName).toBe("Primary Owner");
    expect(recentAudit[0].userEmail).toBe("owner1@indiapay.com");
    expect(recentAudit[0].action).toBe("payroll_run_finalized");
  });

  test("7. Admin has full access to approve payroll run directly", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner1, owner2, admin } = await seedOwnerDashboardWorkspace(t);

    let runId: any;
    await t.run(async (ctx: any) => {
      runId = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-11",
        startDate: "2026-11-01",
        endDate: "2026-11-30",
        status: "pending_approval",
        runType: "regular",
        totalEmployees: 2,
        totalGrossSalary: 100000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 6000,
        totalNetSalary: 94000,
        createdById: admin,
        submittedBy: owner1,
        submittedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Submitter has full admin access to approve directly
    await t.withIdentity(as(owner1)).mutation(api.payroll.approveRun, {
      workspaceId: ws,
      payrollRunId: runId,
    });

    const run = await t.run(async (ctx: any) => ctx.db.get(runId));
    expect(run.status).toBe("approved");
    expect(run.approvedBy).toBe(owner1);
  });

  test("8. Security RBAC: Member account is strictly forbidden from accessing ownerExecutiveSummary or audit", async () => {
    const t = convexTest(schema, modules);
    const { ws } = await seedOwnerDashboardWorkspace(t);

    let memberUserId: any;
    await t.run(async (ctx: any) => {
      memberUserId = await ctx.db.insert("users", {
        name: "Plain Member",
        email: "member@indiapay.com",
      });
      await ctx.db.insert("members", {
        workspaceId: ws,
        userId: memberUserId,
        role: "member",
        createdAt: Date.now(),
      });
    });

    // Member attempting ownerExecutiveSummary
    await expect(
      t
        .withIdentity(as(memberUserId))
        .query(api.dashboard.ownerExecutiveSummary, {
          workspaceId: ws,
        }),
    ).rejects.toThrow();

    // Member attempting audit.recent
    await expect(
      t.withIdentity(as(memberUserId)).query(api.audit.recent, {
        workspaceId: ws,
      }),
    ).rejects.toThrow();
  });

  test("9. Six-month trends handles missing months and deduplicates multiple runs for the same period", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner1 } = await seedOwnerDashboardWorkspace(t);

    await t.run(async (ctx: any) => {
      // 2026-06 (June)
      await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-06",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        status: "processed",
        runType: "regular",
        totalEmployees: 2,
        totalGrossSalary: 80000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 5000,
        totalNetSalary: 75000,
        createdById: owner1,
        finalizedAt: Date.now(),
        createdAt: Date.now() - 120 * 86400 * 1000,
        updatedAt: Date.now(),
      });

      // 2026-08 (August - July is intentionally skipped/missing)
      await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-08",
        startDate: "2026-08-01",
        endDate: "2026-08-31",
        status: "processed",
        runType: "regular",
        totalEmployees: 2,
        totalGrossSalary: 90000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 5500,
        totalNetSalary: 84500,
        createdById: owner1,
        finalizedAt: Date.now(),
        createdAt: Date.now() - 60 * 86400 * 1000,
        updatedAt: Date.now(),
      });

      // Duplicate for 2026-10: an older "approved" run alongside the already existing "processed" run
      await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "approved",
        runType: "regular",
        totalEmployees: 2,
        totalGrossSalary: 98000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 6000,
        totalNetSalary: 92000,
        createdById: owner1,
        createdAt: Date.now() - 15 * 86400 * 1000,
        updatedAt: Date.now(),
      });
    });

    const summary = await t
      .withIdentity(as(owner1))
      .query(api.dashboard.ownerExecutiveSummary, {
        workspaceId: ws,
        periodMonth: "2026-10",
      });

    const trends = summary.businessInsights.monthlyTrends;
    const periods = trends.map((t: any) => t.periodMonth);

    // No duplicate 2026-10 in monthlyTrends
    const octOccurrences = periods.filter(
      (p: string) => p === "2026-10",
    ).length;
    expect(octOccurrences).toBe(1);

    // June and August are present, July is missing without breaking the trend
    expect(periods).toContain("2026-06");
    expect(periods).toContain("2026-08");
    expect(periods).toContain("2026-10");

    // MoM comparison for 2026-10 correctly identifies 2026-08 as the preceding period
    expect(summary.businessInsights.momChange.prevPeriod).toBe("2026-08");
    expect(summary.businessInsights.momChange.grossDiff).toBe(10000); // 100,000 - 90,000
    expect(summary.businessInsights.momChange.grossPercent).toBe(11.1); // +11.1%
  });

  test("10. Audit user resolution safely falls back when user record is missing/deleted", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner1 } = await seedOwnerDashboardWorkspace(t);

    // Insert an audit log with a deleted or non-existent userId
    await t.run(async (ctx: any) => {
      // Create user and delete it to produce a dangling reference
      const tempUser = await ctx.db.insert("users", {
        name: "Temporary User",
        email: "temp@indiapay.com",
      });
      await ctx.db.delete(tempUser);

      await ctx.db.insert("auditLogs", {
        workspaceId: ws,
        userId: tempUser,
        action: "system_maintenance",
        meta: { details: "Orphaned user test" },
        at: Date.now(),
      });
    });

    const summary = await t
      .withIdentity(as(owner1))
      .query(api.dashboard.ownerExecutiveSummary, { workspaceId: ws });

    const orphanAudit = summary.auditActivity.find(
      (a: any) => a.action === "system_maintenance",
    );
    expect(orphanAudit).toBeDefined();
    expect(orphanAudit.userName).toBe("System User");
    expect(orphanAudit.userEmail).toBe("unknown@company.com");
  });
});
