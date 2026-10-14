/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { requireMember, requireRole } from "./orgs";

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
        "./_generated/api.js": () => import("./_generated/api.js"),
        "./_generated/server.js": () => import("./_generated/server.js"),
      };

// Identity helper — getAuthUserId reads `subject = userId|sessionId`.
const as = (userId: string) => ({ subject: `${userId}|sess_${userId}` });

async function seedWorkspace(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const owner = await ctx.db.insert("users", { email: "owner@t.test" });
    const member = await ctx.db.insert("users", { email: "member@t.test" });
    const outsider = await ctx.db.insert("users", { email: "outsider@t.test" });
    const ws = await ctx.db.insert("workspaces", {
      name: "WS",
      ownerId: owner,
      createdAt: Date.now(),
    });
    await ctx.db.insert("members", {
      workspaceId: ws,
      userId: owner,
      role: "owner",
      createdAt: Date.now(),
    });
    const memberRow = await ctx.db.insert("members", {
      workspaceId: ws,
      userId: member,
      role: "member",
      createdAt: Date.now(),
    });
    return { owner, member, outsider, ws, memberRow };
  });
}

describe("authorization helpers", () => {
  test("requireMember throws for a non-member", async () => {
    const t = convexTest(schema, modules);
    const { ws, outsider, member } = await seedWorkspace(t);
    await t.run(async (ctx) => {
      await expect(requireMember(ctx, member, ws)).resolves.toBeTruthy();
      await expect(requireMember(ctx, outsider, ws)).rejects.toThrow(
        /Forbidden/,
      );
    });
  });

  test("requireRole(owner) rejects a plain member", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner, member } = await seedWorkspace(t);
    await t.run(async (ctx) => {
      await expect(
        requireRole(ctx, owner, ws, ["owner"]),
      ).resolves.toBeTruthy();
      await expect(requireRole(ctx, member, ws, ["owner"])).rejects.toThrow(
        /Forbidden/,
      );
    });
  });
});

describe("member management (RBAC + integrity)", () => {
  test("removeMember refuses to remove the owner", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner } = await seedWorkspace(t);
    const ownerMemberRow = await t.run(
      async (ctx) =>
        (
          await ctx.db
            .query("members")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", ws))
            .collect()
        ).find((m) => m.role === "owner")?._id,
    );
    await expect(
      t.withIdentity(as(owner)).mutation(api.orgs.removeMember, {
        workspaceId: ws,
        memberId: ownerMemberRow!,
      }),
    ).rejects.toThrow(/owner/i);
  });

  test("a plain member cannot remove anyone", async () => {
    const t = convexTest(schema, modules);
    const { ws, member, memberRow } = await seedWorkspace(t);
    await expect(
      t.withIdentity(as(member)).mutation(api.orgs.removeMember, {
        workspaceId: ws,
        memberId: memberRow,
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  test("changeRole rejects promotion to owner and bad roles", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner, memberRow } = await seedWorkspace(t);
    const asOwner = t.withIdentity(as(owner));
    await expect(
      asOwner.mutation(api.orgs.changeRole, {
        workspaceId: ws,
        memberId: memberRow,
        role: "owner",
      }),
    ).rejects.toThrow(/Invalid role/);
    await expect(
      asOwner.mutation(api.orgs.changeRole, {
        workspaceId: ws,
        memberId: memberRow,
        role: "superuser",
      }),
    ).rejects.toThrow(/Invalid role/);
    await asOwner.mutation(api.orgs.changeRole, {
      workspaceId: ws,
      memberId: memberRow,
      role: "admin",
    });
    const role = await t.run(
      async (ctx) => (await ctx.db.get(memberRow))?.role,
    );
    expect(role).toBe("admin");
  });
});

describe("cross-tenant isolation (IDOR)", () => {
  test("an outsider cannot read another workspace's jobs", async () => {
    const t = convexTest(schema, modules);
    const { ws, outsider } = await seedWorkspace(t);
    await expect(
      t.withIdentity(as(outsider)).query(api.jobs.list, { workspaceId: ws }),
    ).rejects.toThrow(/Forbidden/);
  });

  test("unauthenticated reads return empty, not an error", async () => {
    const t = convexTest(schema, modules);
    const { ws } = await seedWorkspace(t);
    expect(await t.query(api.jobs.list, { workspaceId: ws })).toEqual([]);
  });
});

describe("jobs.complete idempotency (webhook replay defense)", () => {
  test("completing an already-finished job is a no-op", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner } = await seedWorkspace(t);
    const jobId = await t.run(async (ctx) =>
      ctx.db.insert("jobs", {
        workspaceId: ws,
        userId: owner,
        kind: "demo",
        status: "done",
        result: { first: true },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    await t.mutation(internal.jobs.complete, {
      jobId,
      result: { second: true },
    });
    const job = await t.run(async (ctx) => ctx.db.get(jobId));
    expect(job?.result).toEqual({ first: true });
    expect(job?.status).toBe("done");
  });
});

// Full IDOR matrix: an authenticated outsider must be denied on EVERY workspace-scoped
// surface. This is the in-process, CI-runnable equivalent of the live p2-idor suite.
describe("cross-tenant isolation matrix (outsider vs workspace)", () => {
  // biome-ignore lint/suspicious/noExplicitAny: heterogeneous fn table for a test matrix
  const cases: Array<[string, (b: any, ws: any) => Promise<unknown>]> = [
    ["jobs.list", (b, ws) => b.query(api.jobs.list, { workspaceId: ws })],
    [
      "jobs.listPaged",
      (b, ws) =>
        b.query(api.jobs.listPaged, {
          workspaceId: ws,
          paginationOpts: { numItems: 5, cursor: null },
        }),
    ],
    [
      "jobs.create",
      (b, ws) =>
        b.mutation(api.jobs.create, { workspaceId: ws, kind: "x", input: {} }),
    ],
    [
      "apiKeys.listMine",
      (b, ws) => b.query(api.apiKeys.listMine, { workspaceId: ws }),
    ],
    [
      "apiKeys.create",
      (b, ws) => b.action(api.apiKeys.create, { workspaceId: ws, name: "x" }),
    ],
    ["orgs.members", (b, ws) => b.query(api.orgs.members, { workspaceId: ws })],
    [
      "orgs.invite",
      (b, ws) =>
        b.mutation(api.orgs.invite, {
          workspaceId: ws,
          email: "x@x.test",
          role: "member",
        }),
    ],
    [
      "orgs.pendingInvites",
      (b, ws) => b.query(api.orgs.pendingInvites, { workspaceId: ws }),
    ],
    ["usage.mine", (b, ws) => b.query(api.usage.mine, { workspaceId: ws })],
    ["audit.recent", (b, ws) => b.query(api.audit.recent, { workspaceId: ws })],
    ["files.list", (b, ws) => b.query(api.files.list, { workspaceId: ws })],
    [
      "files.listPaged",
      (b, ws) =>
        b.query(api.files.listPaged, {
          workspaceId: ws,
          paginationOpts: { numItems: 5, cursor: null },
        }),
    ],
    [
      "files.generateUploadUrl",
      (b, ws) => b.mutation(api.files.generateUploadUrl, { workspaceId: ws }),
    ],
  ];
  for (const [name, call] of cases) {
    test(`outsider is denied: ${name}`, async () => {
      const t = convexTest(schema, modules);
      const { ws, outsider } = await seedWorkspace(t);
      await expect(call(t.withIdentity(as(outsider)), ws)).rejects.toThrow();
    });
  }
});

describe("maintained counters (dashboard.stats stays O(1) + correct)", () => {
  test("create workspace/job + complete keeps counters accurate", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) =>
      ctx.db.insert("users", { email: "c@t.test" }),
    );
    const u = t.withIdentity(as(userId));

    const ws = await u.mutation(api.orgs.createWorkspace, { name: "C" });
    let s = await u.query(api.dashboard.stats, { workspaceId: ws });
    expect(s?.members).toBe(1); // owner
    expect(s?.jobs).toBe(0);

    await u.mutation(api.jobs.create, {
      workspaceId: ws,
      kind: "demo",
      input: {},
    });
    s = await u.query(api.dashboard.stats, { workspaceId: ws });
    expect(s?.jobs).toBe(1);
    expect(s?.openJobs).toBe(1);

    const jobId = await t.run(async (ctx) => {
      const j = await ctx.db
        .query("jobs")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", ws))
        .first();
      if (!j) throw new Error("job not found");
      return j._id;
    });
    await t.mutation(internal.jobs.complete, { jobId, result: { ok: true } });
    s = await u.query(api.dashboard.stats, { workspaceId: ws });
    expect(s?.openJobs).toBe(0); // left the open set
    expect(s?.jobs).toBe(1); // total unchanged
  });

  test("dashboard.stats correctly aggregates approved and processed payroll runs and ignores draft/pending/rejected", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner, member } = await seedWorkspace(t);
    const u = t.withIdentity(as(owner));

    // 1. Initially, no payroll runs exist -> empty state (null totals)
    let s = await u.query(api.dashboard.stats, { workspaceId: ws });
    expect(s?.latestGrossPayroll).toBeNull();
    expect(s?.latestNetPayroll).toBeNull();
    expect(s?.latestPeriod).toBeNull();
    expect(s?.pendingApprovalsCount).toBe(0);

    // 2. Insert a draft / calculated payroll run -> should NOT qualify for Gross/Net cards
    const draftRunId = await t.run(async (ctx) => {
      return await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-09",
        startDate: "2026-09-01",
        endDate: "2026-09-30",
        status: "calculated",
        totalEmployees: 3,
        totalGrossSalary: 75000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 5000,
        totalNetSalary: 70000,
        createdById: member,
        createdAt: 1000,
        updatedAt: 1000,
      });
    });

    s = await u.query(api.dashboard.stats, { workspaceId: ws });
    expect(s?.latestGrossPayroll).toBeNull();
    expect(s?.latestNetPayroll).toBeNull();
    expect(s?.pendingApprovalsCount).toBe(0);

    // 3. Move to pending_approval -> should increment pendingApprovalsCount, but NOT Gross/Net
    await t.run(async (ctx) => {
      await ctx.db.patch(draftRunId, {
        status: "pending_approval",
        submittedBy: member,
        submittedAt: 1100,
      });
    });

    s = await u.query(api.dashboard.stats, { workspaceId: ws });
    expect(s?.latestGrossPayroll).toBeNull();
    expect(s?.latestNetPayroll).toBeNull();
    expect(s?.pendingApprovalsCount).toBe(1);

    // 4. Mark as approved -> should now qualify as approved payroll
    await t.run(async (ctx) => {
      await ctx.db.patch(draftRunId, {
        status: "approved",
        approvedBy: owner,
        approvedAt: 1200,
      });
    });

    s = await u.query(api.dashboard.stats, { workspaceId: ws });
    expect(s?.latestGrossPayroll).toBe(75000);
    expect(s?.latestNetPayroll).toBe(70000);
    expect(s?.latestPeriod).toBe("2026-09");
    expect(s?.latestPayrollStatus).toBe("approved");
    expect(s?.pendingApprovalsCount).toBe(0);

    // 5. Add a newer processed run for 2026-10 -> should take precedence as latest qualifying run
    await t.run(async (ctx) => {
      await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "processed",
        totalEmployees: 4,
        totalGrossSalary: 100000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 8000,
        totalNetSalary: 92000,
        createdById: member,
        finalizedBy: owner,
        finalizedAt: 2000,
        createdAt: 1900,
        updatedAt: 2000,
      });
    });

    s = await u.query(api.dashboard.stats, { workspaceId: ws });
    expect(s?.latestGrossPayroll).toBe(100000);
    expect(s?.latestNetPayroll).toBe(92000);
    expect(s?.latestPeriod).toBe("2026-10");
    expect(s?.latestPayrollStatus).toBe("processed");
  });
});

describe("Maker-Checker payroll enforcement & Leave RBAC", () => {
  test("leave.review rejects non-admin / non-owner member", async () => {
    const t = convexTest(schema, modules);
    const { ws, member, owner } = await seedWorkspace(t);

    const empId = await t.run(async (ctx) => {
      return await ctx.db.insert("employees", {
        workspaceId: ws,
        firstName: "Test",
        lastName: "Emp",
        email: "emp@t.test",
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const leaveReqId = await t.run(async (ctx) => {
      return await ctx.db.insert("leaveRequests", {
        workspaceId: ws,
        employeeId: empId,
        leaveType: "casual",
        startDate: "2026-10-01",
        endDate: "2026-10-02",
        daysCount: 2,
        reason: "Personal",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Plain member should be rejected
    await expect(
      t.withIdentity(as(member)).mutation(api.leaves.review, {
        workspaceId: ws,
        requestId: leaveReqId,
        status: "approved",
      }),
    ).rejects.toThrow(/Forbidden/);

    // Owner should succeed
    await expect(
      t.withIdentity(as(owner)).mutation(api.leaves.review, {
        workspaceId: ws,
        requestId: leaveReqId,
        status: "approved",
      }),
    ).resolves.toBeNull();
  });

  test("approveRun rejects submitter (strict two-person Maker-Checker rule)", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner } = await seedWorkspace(t);

    // Add a second owner to test legitimate 2-person approval
    const secondOwner = await t.run(async (ctx) => {
      const u2 = await ctx.db.insert("users", { email: "owner2@t.test" });
      await ctx.db.insert("members", {
        workspaceId: ws,
        userId: u2,
        role: "owner",
        createdAt: Date.now(),
      });
      return u2;
    });

    const runId = await t.run(async (ctx) => {
      return await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-09",
        startDate: "2026-09-01",
        endDate: "2026-09-30",
        status: "pending_approval",
        submittedBy: owner,
        submittedAt: Date.now(),
        createdById: owner,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalGrossSalary: 50000,
        totalNetSalary: 45000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 5000,
        totalEmployees: 1,
      });
    });

    // Submitter cannot approve their own run
    await expect(
      t.withIdentity(as(owner)).mutation(api.payroll.approveRun, {
        workspaceId: ws,
        payrollRunId: runId,
      }),
    ).rejects.toThrow(/You cannot approve a payroll run that you submitted/);

    // Second owner can approve
    await expect(
      t.withIdentity(as(secondOwner)).mutation(api.payroll.approveRun, {
        workspaceId: ws,
        payrollRunId: runId,
      }),
    ).resolves.toBeNull();

    // Verify status updated to approved
    const updated = await t.run(async (ctx) => ctx.db.get(runId));
    expect(updated?.status).toBe("approved");
    expect(updated?.approvedBy).toBe(secondOwner);
  });
});

describe("Employee validation & cross-employee privacy", () => {
  test("employees.add rejects duplicate email in workspace", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner } = await seedWorkspace(t);
    const asOwner = t.withIdentity(as(owner));

    await asOwner.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "John",
      lastName: "Doe",
      email: "duplicate.test@example.com",
    });

    await expect(
      asOwner.mutation(api.employees.add, {
        workspaceId: ws,
        firstName: "Jane",
        lastName: "Smith",
        email: "DUPLICATE.TEST@example.com", // case-insensitive check
      }),
    ).rejects.toThrow(/already exists in this workspace/);
  });

  test("plain member cannot access another employee's salary or company salaries", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner, member } = await seedWorkspace(t);
    const asOwner = t.withIdentity(as(owner));
    const asMember = t.withIdentity(as(member));

    const empId = await asOwner.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Executive",
      lastName: "Leader",
      email: "exec@example.com",
    });

    await asOwner.mutation(api.salaries.add, {
      workspaceId: ws,
      employeeId: empId,
      basicSalary: 150000,
      allowances: [{ name: "Special", amount: 50000 }],
      deductions: [],
      effectiveDate: Date.now(),
    });

    // Plain member querying getCurrentSalaries must be forbidden
    await expect(
      asMember.query(api.salaries.getCurrentSalaries, { workspaceId: ws }),
    ).rejects.toThrow(/Forbidden/);

    // Plain member querying another employee's salary history must be forbidden
    await expect(
      asMember.query(api.salaries.listByEmployee, {
        workspaceId: ws,
        employeeId: empId,
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  test("plain member cannot access another employee's payslip", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner, member } = await seedWorkspace(t);
    const asOwner = t.withIdentity(as(owner));
    const asMember = t.withIdentity(as(member));

    const empId = await asOwner.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Other",
      lastName: "Person",
      email: "other@example.com",
    });

    const runId = await t.run(async (ctx) => {
      const r = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-08",
        startDate: "2026-08-01",
        endDate: "2026-08-31",
        status: "processed",
        totalGrossSalary: 100000,
        totalNetSalary: 90000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 10000,
        totalEmployerContributions: 5000,
        totalEmployees: 1,
        createdById: owner,
        finalizedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: r,
        employeeId: empId,
        basicSalary: 100000,
        allowances: [],
        grossSalary: 100000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [
          { name: "PF", amount: 1800, isConfigured: true },
          { name: "PT", amount: 200, isConfigured: true },
          { name: "TDS", amount: 8000, isConfigured: true },
        ],
        totalStatutoryDeductions: 10000,
        employerContributions: [
          { name: "Employer PF", amount: 5000, isConfigured: true },
        ],
        totalEmployerContributions: 5000,
        totalDeductions: 10000,
        netSalary: 90000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });

      return r;
    });

    // Plain member trying to fetch other person's payslip must fail
    await expect(
      asMember.query(api.payroll.getPayslip, {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
      }),
    ).rejects.toThrow(/Forbidden/);

    // Owner should be allowed to view it
    const payslip = await asOwner.query(api.payroll.getPayslip, {
      workspaceId: ws,
      payrollRunId: runId,
      employeeId: empId,
    });
    expect(payslip.grossSalary).toBe(100000);
    expect(payslip.totalEmployerContributions).toBe(5000);
  });
});

describe("attendance and leave privacy (IDOR prevention)", () => {
  test("plain member cannot access another employee's attendance or leaves", async () => {
    const t = convexTest(schema, modules);
    const { ws, owner, member } = await seedWorkspace(t);
    const asOwner = t.withIdentity(as(owner));
    const asMember = t.withIdentity(as(member));

    // Create Employee A (linked to member) and Employee B (unlinked or another employee)
    const empA = await asOwner.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Member",
      lastName: "Emp",
      email: "member@t.test",
    });
    // Link empA to member
    await t.run(async (ctx) => {
      await ctx.db.patch(empA, { userId: member });
    });

    const empB = await asOwner.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Other",
      lastName: "Emp",
      email: "otheremp@example.com",
    });

    // Seed attendance & leave records for empB
    await t.run(async (ctx) => {
      await ctx.db.insert("attendance", {
        workspaceId: ws,
        employeeId: empB,
        date: "2026-08-10",
        status: "present",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("leaveRequests", {
        workspaceId: ws,
        employeeId: empB,
        leaveType: "casual",
        startDate: "2026-08-12",
        endDate: "2026-08-13",
        daysCount: 2,
        reason: "Personal",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // 1. Plain member querying attendance with empB id should be rejected
    await expect(
      asMember.query(api.attendance.list, {
        workspaceId: ws,
        employeeId: empB,
      }),
    ).rejects.toThrow(/Forbidden/);

    // 2. Plain member querying leaves with empB id should be rejected
    await expect(
      asMember.query(api.leaves.list, {
        workspaceId: ws,
        employeeId: empB,
      }),
    ).rejects.toThrow(/Forbidden/);

    // 3. Plain member attempting to submit leave for empB should be rejected
    await expect(
      asMember.mutation(api.leaves.submit, {
        workspaceId: ws,
        employeeId: empB,
        leaveType: "sick",
        startDate: "2026-08-15",
        endDate: "2026-08-15",
        daysCount: 1,
        reason: "Sick day",
      }),
    ).rejects.toThrow(/Forbidden/);

    // 4. Plain member querying leaves without employeeId should only receive their own records
    const memberLeaves = await asMember.query(api.leaves.list, {
      workspaceId: ws,
    });
    expect(memberLeaves.length).toBe(0); // empB's leave record must not leak!
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin vs Member RBAC — dev account role verification
//
// These tests use in-process convex-test (no live deployment needed) to verify
// that the two dev accounts (admin@indiapaypayroll.com = "admin" role,
// user@indiapaypayroll.com = "member" role) will experience the correct
// permission boundaries once provisioned.
// ─────────────────────────────────────────────────────────────────────────────
describe("Admin vs Member RBAC — dev account role verification", () => {
  /** Seed a workspace with owner, admin, and member users. */
  async function seedWithAdmin(t: ReturnType<typeof convexTest>) {
    return t.run(async (ctx) => {
      const owner = await ctx.db.insert("users", {
        email: "owner@indiapaypayroll.test",
      });
      const admin = await ctx.db.insert("users", {
        email: "admin@indiapaypayroll.test",
      });
      const member = await ctx.db.insert("users", {
        email: "user@indiapaypayroll.test",
      });

      const ws = await ctx.db.insert("workspaces", {
        name: "IndiaPay Dev Workspace",
        ownerId: owner,
        createdAt: Date.now(),
      });
      await ctx.db.insert("members", {
        workspaceId: ws,
        userId: owner,
        role: "owner",
        createdAt: Date.now(),
      });
      const adminRow = await ctx.db.insert("members", {
        workspaceId: ws,
        userId: admin,
        role: "admin",
        createdAt: Date.now(),
      });
      const memberRow = await ctx.db.insert("members", {
        workspaceId: ws,
        userId: member,
        role: "member",
        createdAt: Date.now(),
      });
      return { owner, admin, member, ws, adminRow, memberRow };
    });
  }

  // ── Workspace management ──────────────────────────────────────────────────

  test("admin can invite users; plain member cannot", async () => {
    const t = convexTest(schema, modules);
    const { admin, member, ws } = await seedWithAdmin(t);

    // Admin should be able to invite
    await expect(
      t.withIdentity(as(admin)).mutation(api.orgs.invite, {
        workspaceId: ws,
        email: "newperson@example.com",
        role: "member",
      }),
    ).resolves.toBeDefined();

    // Plain member must be denied
    await expect(
      t.withIdentity(as(member)).mutation(api.orgs.invite, {
        workspaceId: ws,
        email: "another@example.com",
        role: "member",
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  test("admin can remove a member; plain member cannot remove anyone", async () => {
    const t = convexTest(schema, modules);
    const { admin, member, memberRow } = await seedWithAdmin(t);
    const ws = await t.run(
      async (ctx) => (await ctx.db.get(memberRow))!.workspaceId,
    );

    // Plain member is forbidden
    await expect(
      t.withIdentity(as(member)).mutation(api.orgs.removeMember, {
        workspaceId: ws,
        memberId: memberRow,
      }),
    ).rejects.toThrow(/Forbidden/);

    // Admin can remove
    await expect(
      t.withIdentity(as(admin)).mutation(api.orgs.removeMember, {
        workspaceId: ws,
        memberId: memberRow,
      }),
    ).resolves.toBeNull();
  });

  test("admin can change member roles; plain member cannot", async () => {
    const t = convexTest(schema, modules);
    const { admin, member, memberRow } = await seedWithAdmin(t);
    const ws = await t.run(
      async (ctx) => (await ctx.db.get(memberRow))!.workspaceId,
    );

    // Plain member is forbidden
    await expect(
      t.withIdentity(as(member)).mutation(api.orgs.changeRole, {
        workspaceId: ws,
        memberId: memberRow,
        role: "admin",
      }),
    ).rejects.toThrow(/Forbidden/);

    // Admin can change roles
    await expect(
      t.withIdentity(as(admin)).mutation(api.orgs.changeRole, {
        workspaceId: ws,
        memberId: memberRow,
        role: "admin",
      }),
    ).resolves.toBeNull();
  });

  test("admin cannot be promoted to owner via changeRole (owner is a protected role)", async () => {
    const t = convexTest(schema, modules);
    const { owner, adminRow } = await seedWithAdmin(t);
    const ws = await t.run(
      async (ctx) => (await ctx.db.get(adminRow))!.workspaceId,
    );

    await expect(
      t.withIdentity(as(owner)).mutation(api.orgs.changeRole, {
        workspaceId: ws,
        memberId: adminRow,
        role: "owner",
      }),
    ).rejects.toThrow(/Invalid role/);
  });

  // ── Payroll data access ───────────────────────────────────────────────────

  test("admin can view all salaries; plain member cannot", async () => {
    const t = convexTest(schema, modules);
    const { admin, member, ws } = await seedWithAdmin(t);
    const asAdmin = t.withIdentity(as(admin));
    const asMember = t.withIdentity(as(member));

    // Add an employee with salary
    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Salary",
      lastName: "Employee",
      email: "salemp@indiapaypayroll.test",
    });
    await asAdmin.mutation(api.salaries.add, {
      workspaceId: ws,
      employeeId: empId,
      basicSalary: 80000,
      allowances: [],
      deductions: [],
      effectiveDate: Date.now(),
    });

    // Admin allowed
    const salaries = await asAdmin.query(api.salaries.getCurrentSalaries, {
      workspaceId: ws,
    });
    expect(salaries.length).toBeGreaterThan(0);

    // Member denied
    await expect(
      asMember.query(api.salaries.getCurrentSalaries, { workspaceId: ws }),
    ).rejects.toThrow(/Forbidden/);
  });

  test("admin can view payslips; plain member cannot view others' payslips", async () => {
    const t = convexTest(schema, modules);
    const { admin, member, ws } = await seedWithAdmin(t);
    const asAdmin = t.withIdentity(as(admin));
    const asMember = t.withIdentity(as(member));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Pay",
      lastName: "Slip",
      email: "payslip@indiapaypayroll.test",
    });

    const runId = await t.run(async (ctx) => {
      const r = await ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-09",
        startDate: "2026-09-01",
        endDate: "2026-09-30",
        status: "processed",
        totalGrossSalary: 80000,
        totalNetSalary: 72000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 8000,
        totalEmployees: 1,
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("payrollItems", {
        workspaceId: ws,
        payrollRunId: r,
        employeeId: empId,
        basicSalary: 80000,
        allowances: [],
        grossSalary: 80000,
        lopDays: 0,
        lopDeduction: 0,
        customDeductions: [],
        totalCustomDeductions: 0,
        statutoryDeductions: [{ name: "PF", amount: 8000, isConfigured: true }],
        totalStatutoryDeductions: 8000,
        employerContributions: [],
        totalEmployerContributions: 0,
        totalDeductions: 8000,
        netSalary: 72000,
        hasSalaryStructure: true,
        warnings: [],
        createdAt: Date.now(),
      });
      return r;
    });

    // Admin can view
    const payslip = await asAdmin.query(api.payroll.getPayslip, {
      workspaceId: ws,
      payrollRunId: runId,
      employeeId: empId,
    });
    expect(payslip.grossSalary).toBe(80000);

    // Member cannot view another's payslip
    await expect(
      asMember.query(api.payroll.getPayslip, {
        workspaceId: ws,
        payrollRunId: runId,
        employeeId: empId,
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  // ── Maker-Checker: admin is subject to the same two-person rule ───────────

  test("admin cannot approve payroll runs (owner-only permission) & maker-checker enforcement", async () => {
    const t = convexTest(schema, modules);
    const { admin, owner, ws } = await seedWithAdmin(t);

    const runId = await t.run(async (ctx) =>
      ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "pending_approval",
        submittedBy: admin, // admin submitted it
        submittedAt: Date.now(),
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalGrossSalary: 60000,
        totalNetSalary: 54000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 6000,
        totalEmployees: 1,
      }),
    );

    // Admin is not owner, so admin cannot approve (strict RBAC protection)
    await expect(
      t.withIdentity(as(admin)).mutation(api.payroll.approveRun, {
        workspaceId: ws,
        payrollRunId: runId,
      }),
    ).rejects.toThrow(/Forbidden/);

    // Owner (different person) can approve
    await expect(
      t.withIdentity(as(owner)).mutation(api.payroll.approveRun, {
        workspaceId: ws,
        payrollRunId: runId,
      }),
    ).resolves.toBeNull();
  });

  test("admin cannot reject payroll runs (owner-only permission)", async () => {
    const t = convexTest(schema, modules);
    const { admin, ws } = await seedWithAdmin(t);

    const runId = await t.run(async (ctx) =>
      ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "pending_approval",
        submittedBy: admin,
        submittedAt: Date.now(),
        createdById: admin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalGrossSalary: 60000,
        totalNetSalary: 54000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 6000,
        totalEmployees: 1,
      }),
    );

    // Admin cannot reject (strict RBAC protection: owner only)
    await expect(
      t.withIdentity(as(admin)).mutation(api.payroll.rejectRun, {
        workspaceId: ws,
        payrollRunId: runId,
        reason: "Test rejection",
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  test("plain member cannot calculate preview, list runs, or view run details (RBAC data privacy)", async () => {
    const t = convexTest(schema, modules);
    const { member, ws } = await seedWithAdmin(t);
    const asMember = t.withIdentity(as(member));

    const runId = await t.run(async (ctx) =>
      ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-10",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status: "calculated",
        createdById: member,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalGrossSalary: 60000,
        totalNetSalary: 54000,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 6000,
        totalEmployees: 1,
      }),
    );

    // Plain member cannot calculate preview
    await expect(
      asMember.query(api.payroll.calculatePreview, {
        workspaceId: ws,
        periodMonth: "2026-10",
      }),
    ).rejects.toThrow(/Forbidden/);

    // Plain member cannot list runs
    await expect(
      asMember.query(api.payroll.listRuns, {
        workspaceId: ws,
      }),
    ).rejects.toThrow(/Forbidden/);

    // Plain member cannot view full run details
    await expect(
      asMember.query(api.payroll.getRunDetails, {
        workspaceId: ws,
        payrollRunId: runId,
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  // ── Leave approval ────────────────────────────────────────────────────────

  test("admin can approve leave requests; plain member cannot", async () => {
    const t = convexTest(schema, modules);
    const { admin, member, ws } = await seedWithAdmin(t);
    const asAdmin = t.withIdentity(as(admin));
    const asMember = t.withIdentity(as(member));

    const empId = await asAdmin.mutation(api.employees.add, {
      workspaceId: ws,
      firstName: "Leave",
      lastName: "Tester",
      email: "leavetester@indiapaypayroll.test",
    });

    const leaveId = await t.run(async (ctx) =>
      ctx.db.insert("leaveRequests", {
        workspaceId: ws,
        employeeId: empId,
        leaveType: "casual",
        startDate: "2026-11-01",
        endDate: "2026-11-01",
        daysCount: 1,
        reason: "Personal",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );

    // Plain member denied
    await expect(
      asMember.mutation(api.leaves.review, {
        workspaceId: ws,
        requestId: leaveId,
        status: "approved",
      }),
    ).rejects.toThrow(/Forbidden/);

    // Admin allowed
    await expect(
      asAdmin.mutation(api.leaves.review, {
        workspaceId: ws,
        requestId: leaveId,
        status: "approved",
      }),
    ).resolves.toBeNull();
  });

  // ── Pending invites visibility ────────────────────────────────────────────

  test("admin can list pending invites; plain member cannot", async () => {
    const t = convexTest(schema, modules);
    const { admin, member, ws } = await seedWithAdmin(t);

    // Admin can read pending invites
    await expect(
      t.withIdentity(as(admin)).query(api.orgs.pendingInvites, {
        workspaceId: ws,
      }),
    ).resolves.toBeInstanceOf(Array);

    // Plain member is denied
    await expect(
      t.withIdentity(as(member)).query(api.orgs.pendingInvites, {
        workspaceId: ws,
      }),
    ).rejects.toThrow(/Forbidden/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Owner Account Provisioning, RBAC, and Maker-Checker Enforcement
// ─────────────────────────────────────────────────────────────────────────────
describe("Owner Account Provisioning, RBAC & Maker-Checker Suite", () => {
  const DEV_OWNER_EMAIL = "owner@indiapaypayroll.com";
  const DEV_ADMIN_EMAIL = "admin@indiapaypayroll.com";
  const DEV_USER_EMAIL = "user@indiapaypayroll.com";

  test("devAccountsMutation requires DEV_SEED=1 guard", async () => {
    const t = convexTest(schema, modules);
    const origSeed = process.env.DEV_SEED;
    try {
      delete process.env.DEV_SEED;
      await expect(
        t.mutation(internal.devAccountsMutation.provisionDevAccountsMutation, {
          ownerHash: "mock_hash_owner",
        }),
      ).rejects.toThrow(/Dev\/seed functions are disabled/);
    } finally {
      process.env.DEV_SEED = origSeed;
    }
  });

  test("provisionDevAccountsMutation correctly provisions Owner account with role=owner", async () => {
    const t = convexTest(schema, modules);
    process.env.DEV_SEED = "1";

    const result = await t.mutation(
      internal.devAccountsMutation.provisionDevAccountsMutation,
      {
        ownerHash: "scrypt_mock_owner_hash",
        adminHash: "scrypt_mock_admin_hash",
        userHash: "scrypt_mock_user_hash",
      },
    );

    expect(result.ownerCreated).toBe(true);
    expect(result.adminCreated).toBe(true);
    expect(result.userCreated).toBe(true);

    const wsId = result.workspaceId as any;

    await t.run(async (ctx) => {
      // 1. Verify Owner user & authAccount
      const ownerUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", DEV_OWNER_EMAIL))
        .unique();
      expect(ownerUser).toBeDefined();
      expect(ownerUser?.emailVerificationTime).toBeDefined();

      const ownerAuth = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", DEV_OWNER_EMAIL),
        )
        .unique();
      expect(ownerAuth).toBeDefined();
      expect(ownerAuth?.userId).toEqual(ownerUser?._id);
      expect(ownerAuth?.secret).toBe("scrypt_mock_owner_hash");
      expect(ownerAuth?.emailVerified).toBe(DEV_OWNER_EMAIL);

      // 2. Verify Members table roles: Owner=owner, Admin=admin, User=member
      const ownerMember = await ctx.db
        .query("members")
        .withIndex("by_user_workspace", (q) =>
          q.eq("userId", ownerUser!._id).eq("workspaceId", wsId),
        )
        .unique();
      expect(ownerMember?.role).toBe("owner");

      const adminUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", DEV_ADMIN_EMAIL))
        .unique();
      const adminMember = await ctx.db
        .query("members")
        .withIndex("by_user_workspace", (q) =>
          q.eq("userId", adminUser!._id).eq("workspaceId", wsId),
        )
        .unique();
      expect(adminMember?.role).toBe("admin");

      const userUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", DEV_USER_EMAIL))
        .unique();
      const userMember = await ctx.db
        .query("members")
        .withIndex("by_user_workspace", (q) =>
          q.eq("userId", userUser!._id).eq("workspaceId", wsId),
        )
        .unique();
      expect(userMember?.role).toBe("member");

      // 3. Verify Owner employee record
      const ownerEmp = await ctx.db
        .query("employees")
        .withIndex("by_email", (q) => q.eq("email", DEV_OWNER_EMAIL))
        .filter((q) => q.eq(q.field("workspaceId"), wsId))
        .first();
      expect(ownerEmp).toBeDefined();
      expect(ownerEmp?.userId).toEqual(ownerUser?._id);
      expect(ownerEmp?.status).toBe("active");
    });
  });

  test("Owner provisioning is idempotent and updates credentials without altering roles", async () => {
    const t = convexTest(schema, modules);
    process.env.DEV_SEED = "1";

    // Initial provision
    const res1 = await t.mutation(
      internal.devAccountsMutation.provisionDevAccountsMutation,
      {
        ownerHash: "initial_owner_hash",
        adminHash: "initial_admin_hash",
      },
    );

    // Re-provision with updated owner hash (simulating password rotation)
    const res2 = await t.mutation(
      internal.devAccountsMutation.provisionDevAccountsMutation,
      {
        ownerHash: "updated_owner_hash",
      },
    );

    expect(res2.workspaceId).toBe(res1.workspaceId);
    expect(res2.ownerCreated).toBe(false); // already existed

    await t.run(async (ctx) => {
      const ownerAuth = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", DEV_OWNER_EMAIL),
        )
        .unique();
      expect(ownerAuth?.secret).toBe("updated_owner_hash");

      // Verify Admin hash was preserved (not overwritten by undefined)
      const adminAuth = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", DEV_ADMIN_EMAIL),
        )
        .unique();
      expect(adminAuth?.secret).toBe("initial_admin_hash");
    });
  });

  test("Owner can authenticate and workspace identifies role as owner", async () => {
    const t = convexTest(schema, modules);
    process.env.DEV_SEED = "1";

    const { workspaceId } = await t.mutation(
      internal.devAccountsMutation.provisionDevAccountsMutation,
      { ownerHash: "h1", adminHash: "h2", userHash: "h3" },
    );

    const ownerUser = await t.run(async (ctx) =>
      (await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", DEV_OWNER_EMAIL))
        .unique())!._id,
    );

    const asOwner = t.withIdentity(as(ownerUser));
    const workspaces = await asOwner.query(api.orgs.myWorkspaces, {});
    const targetWs = workspaces.find((w) => w._id === (workspaceId as any));
    expect(targetWs).toBeDefined();
    expect(targetWs?.role).toBe("owner");
  });

  test("Owner can approve/reject payroll run submitted by Admin, but cannot approve run submitted by Owner", async () => {
    const t = convexTest(schema, modules);
    process.env.DEV_SEED = "1";

    const { workspaceId } = await t.mutation(
      internal.devAccountsMutation.provisionDevAccountsMutation,
      { ownerHash: "h1", adminHash: "h2", userHash: "h3" },
    );
    const ws = workspaceId as any;

    const { ownerUser, adminUser } = await t.run(async (ctx) => {
      const o = (await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", DEV_OWNER_EMAIL))
        .unique())!._id;
      const a = (await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", DEV_ADMIN_EMAIL))
        .unique())!._id;
      return { ownerUser: o, adminUser: a };
    });

    const asOwner = t.withIdentity(as(ownerUser));
    const asAdmin = t.withIdentity(as(adminUser));

    // Run 1: Submitted by Admin
    const run1Id = await t.run(async (ctx) =>
      ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-11",
        startDate: "2026-11-01",
        endDate: "2026-11-30",
        status: "pending_approval",
        submittedBy: adminUser,
        submittedAt: Date.now(),
        createdById: adminUser,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalGrossSalary: 75000,
        totalNetSalary: 67500,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 7500,
        totalEmployees: 1,
      }),
    );

    // Admin cannot approve
    await expect(
      asAdmin.mutation(api.payroll.approveRun, {
        workspaceId: ws,
        payrollRunId: run1Id,
      }),
    ).rejects.toThrow(/Forbidden/);

    // Admin cannot reject
    await expect(
      asAdmin.mutation(api.payroll.rejectRun, {
        workspaceId: ws,
        payrollRunId: run1Id,
        reason: "Admin trying to reject",
      }),
    ).rejects.toThrow(/Forbidden/);

    // Owner CAN approve run submitted by Admin
    await expect(
      asOwner.mutation(api.payroll.approveRun, {
        workspaceId: ws,
        payrollRunId: run1Id,
      }),
    ).resolves.toBeNull();

    const updatedRun1 = await t.run(async (ctx) => ctx.db.get(run1Id));
    expect(updatedRun1?.status).toBe("approved");
    expect(updatedRun1?.approvedBy).toBe(ownerUser);

    // Run 2: Submitted by Owner
    const run2Id = await t.run(async (ctx) =>
      ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2026-12",
        startDate: "2026-12-01",
        endDate: "2026-12-31",
        status: "pending_approval",
        submittedBy: ownerUser,
        submittedAt: Date.now(),
        createdById: ownerUser,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalGrossSalary: 75000,
        totalNetSalary: 67500,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 7500,
        totalEmployees: 1,
      }),
    );

    // Strict Maker-Checker: Owner CANNOT approve their own run
    await expect(
      asOwner.mutation(api.payroll.approveRun, {
        workspaceId: ws,
        payrollRunId: run2Id,
      }),
    ).rejects.toThrow(/You cannot approve a payroll run that you submitted/);

    // Run 3: Testing Owner rejection of Admin submitted run
    const run3Id = await t.run(async (ctx) =>
      ctx.db.insert("payrollRuns", {
        workspaceId: ws,
        periodMonth: "2027-01",
        startDate: "2027-01-01",
        endDate: "2027-01-31",
        status: "pending_approval",
        submittedBy: adminUser,
        submittedAt: Date.now(),
        createdById: adminUser,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalGrossSalary: 75000,
        totalNetSalary: 67500,
        totalLopDeduction: 0,
        totalCustomDeductions: 0,
        totalStatutoryDeductions: 7500,
        totalEmployees: 1,
      }),
    );

    // Owner CAN reject run submitted by Admin
    await expect(
      asOwner.mutation(api.payroll.rejectRun, {
        workspaceId: ws,
        payrollRunId: run3Id,
        reason: "Review required for bonuses",
      }),
    ).resolves.toBeNull();

    const updatedRun3 = await t.run(async (ctx) => ctx.db.get(run3Id));
    expect(updatedRun3?.status).toBe("calculated");
    expect(updatedRun3?.rejectionReason).toBe("Review required for bonuses");
    expect(updatedRun3?.rejectedBy).toBe(ownerUser);
  });
});

