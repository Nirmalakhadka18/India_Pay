/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { requireMember, requireRole } from "./orgs";

// Discover function modules for convex-test (includes _generated, excludes *.test.ts).
const modules = import.meta.glob(["./**/*.*s", "!./**/*.test.*"]);

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
      t
        .withIdentity(as(owner))
        .mutation(api.orgs.removeMember, {
          workspaceId: ws,
          memberId: ownerMemberRow!,
        }),
    ).rejects.toThrow(/owner/i);
  });

  test("a plain member cannot remove anyone", async () => {
    const t = convexTest(schema, modules);
    const { ws, member, memberRow } = await seedWorkspace(t);
    await expect(
      t
        .withIdentity(as(member))
        .mutation(api.orgs.removeMember, {
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
      })
    ).rejects.toThrow(/Forbidden/);

    // 2. Plain member querying leaves with empB id should be rejected
    await expect(
      asMember.query(api.leaves.list, {
        workspaceId: ws,
        employeeId: empB,
      })
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
      })
    ).rejects.toThrow(/Forbidden/);

    // 4. Plain member querying leaves without employeeId should only receive their own records
    const memberLeaves = await asMember.query(api.leaves.list, {
      workspaceId: ws,
    });
    expect(memberLeaves.length).toBe(0); // empB's leave record must not leak!
  });
});



