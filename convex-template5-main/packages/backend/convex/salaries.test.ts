import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { isSalaryNewer } from "./salaries";
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

// biome-ignore lint/suspicious/noExplicitAny: convexTest runner instance
async function seedSalaryTestWorkspace(t: any) {
  let ws!: Id<"workspaces">;
  let admin!: Id<"users">;
  let empId!: Id<"employees">;

  await t.run(async (ctx: MutationCtx) => {
    admin = await ctx.db.insert("users", {
      name: "Admin User",
      email: "admin@indiapay.com",
      emailVerificationTime: Date.now(),
    });

    ws = await ctx.db.insert("workspaces", {
      name: "IndiaPay Dev Org",
      ownerId: admin,
      createdAt: Date.now(),
    });

    await ctx.db.insert("members", {
      workspaceId: ws,
      userId: admin,
      role: "admin",
      createdAt: Date.now(),
    });

    empId = await ctx.db.insert("employees", {
      workspaceId: ws,
      firstName: "Aarav",
      lastName: "Patel",
      email: "aarav.patel@indiapay.com",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  return { ws, admin, empId };
}

describe("Salary Structure & Monthly Gross Reconciliation Suite", () => {
  test("Admin can set salary with Monthly Gross Salary and reconciled 50/20/30 components", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin, empId } = await seedSalaryTestWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const gross = 50000;
    const basic = 25000; // 50%
    const hra = 10000; // 20%
    const special = 15000; // 30%

    const salaryId = await asAdmin.mutation(api.salaries.add, {
      workspaceId: ws,
      employeeId: empId,
      grossSalary: gross,
      basicSalary: basic,
      allowances: [
        { name: "HRA", amount: hra },
        { name: "Special Allowance", amount: special },
      ],
      deductions: [],
      effectiveDate: Date.now(),
    });

    expect(salaryId).toBeDefined();

    const currentSalaries = await asAdmin.query(api.salaries.getCurrentSalaries, {
      workspaceId: ws,
    });
    expect(currentSalaries.length).toBe(1);
    expect(currentSalaries[0].grossSalary).toBe(50000);
    expect(currentSalaries[0].basicSalary).toBe(25000);
    expect(currentSalaries[0].allowances.length).toBe(2);
  });

  test("Rejects salary setup when component sum does not reconcile with entered gross salary", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin, empId } = await seedSalaryTestWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    await expect(
      asAdmin.mutation(api.salaries.add, {
        workspaceId: ws,
        employeeId: empId,
        grossSalary: 60000, // Budgeted 60,000 but components sum to 50,000
        basicSalary: 25000,
        allowances: [
          { name: "HRA", amount: 10000 },
          { name: "Special Allowance", amount: 15000 },
        ],
        deductions: [],
        effectiveDate: Date.now(),
      }),
    ).rejects.toThrow("does not reconcile with entered gross salary");
  });

  test("Rejects non-positive monthly gross salary", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin, empId } = await seedSalaryTestWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    await expect(
      asAdmin.mutation(api.salaries.add, {
        workspaceId: ws,
        employeeId: empId,
        grossSalary: 0,
        basicSalary: 0,
        allowances: [],
        deductions: [],
        effectiveDate: Date.now(),
      }),
    ).rejects.toThrow("Monthly gross salary must be greater than zero");
  });

  test("Rejects negative basic salary or negative allowance amount", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin, empId } = await seedSalaryTestWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    await expect(
      asAdmin.mutation(api.salaries.add, {
        workspaceId: ws,
        employeeId: empId,
        grossSalary: 50000,
        basicSalary: -1000,
        allowances: [{ name: "HRA", amount: 51000 }],
        deductions: [],
        effectiveDate: Date.now(),
      }),
    ).rejects.toThrow("Basic salary cannot be negative");

    await expect(
      asAdmin.mutation(api.salaries.add, {
        workspaceId: ws,
        employeeId: empId,
        grossSalary: 50000,
        basicSalary: 30000,
        allowances: [{ name: "HRA", amount: -5000 }],
        deductions: [],
        effectiveDate: Date.now(),
      }),
    ).rejects.toThrow("cannot have a negative amount");
  });

  test("Backward compatibility: computes grossSalary automatically when grossSalary arg is omitted", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin, empId } = await seedSalaryTestWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    // Legacy caller that does not supply grossSalary argument
    const salaryId = await asAdmin.mutation(api.salaries.add, {
      workspaceId: ws,
      employeeId: empId,
      basicSalary: 35000,
      allowances: [
        { name: "HRA", amount: 15000 },
        { name: "Conveyance", amount: 2000 },
      ],
      deductions: [],
      effectiveDate: Date.now(),
    });

    expect(salaryId).toBeDefined();

    const history = await asAdmin.query(api.salaries.listByEmployee, {
      workspaceId: ws,
      employeeId: empId,
    });

    expect(history.length).toBe(1);
    expect(history[0].grossSalary).toBe(52000); // 35000 + 15000 + 2000
    expect(history[0].basicSalary).toBe(35000);
  });

  test("Deterministic tie-breaking: multiple revisions on the exact same effective date select the latest created revision", async () => {
    const t = convexTest(schema, modules);
    const { ws, admin, empId } = await seedSalaryTestWorkspace(t);
    const asAdmin = t.withIdentity(as(admin));

    const sameDay = 1729641600000; // e.g. Oct 23, 2024

    // Revision 1: initial setup on sameDay (e.g. ₹50,000 gross)
    const sal1Id = await asAdmin.mutation(api.salaries.add, {
      workspaceId: ws,
      employeeId: empId,
      grossSalary: 50000,
      basicSalary: 25000,
      allowances: [
        { name: "HRA", amount: 10000 },
        { name: "Special Allowance", amount: 15000 },
      ],
      deductions: [],
      effectiveDate: sameDay,
    });

    // Small delay or sequence guarantee
    // Revision 2: updated revision on the exact sameDay (e.g. typo correction to ₹55,000 gross)
    const sal2Id = await asAdmin.mutation(api.salaries.add, {
      workspaceId: ws,
      employeeId: empId,
      grossSalary: 55000,
      basicSalary: 27500,
      allowances: [
        { name: "HRA", amount: 11000 },
        { name: "Special Allowance", amount: 16500 },
      ],
      deductions: [],
      effectiveDate: sameDay,
    });

    expect(sal1Id).toBeDefined();
    expect(sal2Id).toBeDefined();

    // 1. getCurrentSalaries must deterministically return Revision 2
    const currentList = await asAdmin.query(api.salaries.getCurrentSalaries, {
      workspaceId: ws,
    });
    expect(currentList.length).toBe(1);
    expect(currentList[0]._id).toBe(sal2Id);
    expect(currentList[0].grossSalary).toBe(55000);
    expect(currentList[0].basicSalary).toBe(27500);

    // 2. listByEmployee must sort Revision 2 before Revision 1
    const history = await asAdmin.query(api.salaries.listByEmployee, {
      workspaceId: ws,
      employeeId: empId,
    });
    expect(history.length).toBe(2);
    expect(history[0]._id).toBe(sal2Id);
    expect(history[1]._id).toBe(sal1Id);

    // 3. payroll.calculatePreview must compute payroll using Revision 2 (₹55,000)
    const preview = await asAdmin.query(api.payroll.calculatePreview, {
      workspaceId: ws,
      periodMonth: "2024-10",
    });
    expect(preview.items.length).toBe(1);
    expect(preview.items[0].grossSalary).toBe(55000);
    expect(preview.items[0].basicSalary).toBe(27500);
  });

  test("isSalaryNewer pure function behaves deterministically across boundary conditions", () => {
    // Newer effectiveDate always wins
    expect(
      isSalaryNewer(
        { effectiveDate: 200, createdAt: 100 },
        { effectiveDate: 100, createdAt: 500 },
      ),
    ).toBe(true);

    // Older effectiveDate loses even with higher createdAt
    expect(
      isSalaryNewer(
        { effectiveDate: 100, createdAt: 500 },
        { effectiveDate: 200, createdAt: 100 },
      ),
    ).toBe(false);

    // Identical effectiveDate: higher createdAt wins
    expect(
      isSalaryNewer(
        { effectiveDate: 100, createdAt: 501 },
        { effectiveDate: 100, createdAt: 500 },
      ),
    ).toBe(true);

    // Identical effectiveDate: lower createdAt loses
    expect(
      isSalaryNewer(
        { effectiveDate: 100, createdAt: 499 },
        { effectiveDate: 100, createdAt: 500 },
      ),
    ).toBe(false);

    // Fallback to _creationTime if createdAt is undefined
    expect(
      isSalaryNewer(
        { effectiveDate: 100, _creationTime: 600 },
        { effectiveDate: 100, _creationTime: 500 },
      ),
    ).toBe(true);
  });
});
