import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { isOverlappingLeave } from "./leaves";

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
        "./delegates.ts": () => import("./delegates"),
        "./helpdesk.ts": () => import("./helpdesk"),
        "./resignation.ts": () => import("./resignation"),
        "./engage.ts": () => import("./engage"),
        "./_generated/api.js": () => import("./_generated/api.js"),
        "./_generated/server.js": () => import("./_generated/server.js"),
      };

const as = (userId: string) => ({ subject: `${userId}|sess_${userId}` });

describe("Leave Management Audit Fix Suite", () => {
  describe("isOverlappingLeave pure math & boundary unit tests", () => {
    test("Disjoint date ranges do not overlap", () => {
      expect(
        isOverlappingLeave(
          { startDate: "2026-11-01", endDate: "2026-11-03" },
          { startDate: "2026-11-05", endDate: "2026-11-07" },
        ),
      ).toBe(false);

      expect(
        isOverlappingLeave(
          { startDate: "2026-11-10", endDate: "2026-11-12" },
          { startDate: "2026-11-01", endDate: "2026-11-05" },
        ),
      ).toBe(false);
    });

    test("Identical dates overlap and are flagged", () => {
      expect(
        isOverlappingLeave(
          { startDate: "2026-11-05", endDate: "2026-11-05", session: "full_day" },
          { startDate: "2026-11-05", endDate: "2026-11-05", session: "full_day" },
        ),
      ).toBe(true);
    });

    test("Multi-day overlapping ranges are flagged", () => {
      expect(
        isOverlappingLeave(
          { startDate: "2026-11-01", endDate: "2026-11-05" },
          { startDate: "2026-11-03", endDate: "2026-11-08" },
        ),
      ).toBe(true);

      expect(
        isOverlappingLeave(
          { startDate: "2026-11-02", endDate: "2026-11-04" },
          { startDate: "2026-11-01", endDate: "2026-11-10" },
        ),
      ).toBe(true);
    });

    test("Single-day boundary with opposite sessions allowed (Session 1 vs Session 2)", () => {
      // First half vs Second half on the exact same single date do not conflict
      expect(
        isOverlappingLeave(
          { startDate: "2026-11-05", endDate: "2026-11-05", session: "session_1" },
          { startDate: "2026-11-05", endDate: "2026-11-05", session: "session_2" },
        ),
      ).toBe(false);

      expect(
        isOverlappingLeave(
          { startDate: "2026-11-05", endDate: "2026-11-05", session: "session_2" },
          { startDate: "2026-11-05", endDate: "2026-11-05", session: "session_1" },
        ),
      ).toBe(false);
    });

    test("Single-day same session or full-day conflict is flagged", () => {
      expect(
        isOverlappingLeave(
          { startDate: "2026-11-05", endDate: "2026-11-05", session: "session_1" },
          { startDate: "2026-11-05", endDate: "2026-11-05", session: "session_1" },
        ),
      ).toBe(true);

      expect(
        isOverlappingLeave(
          { startDate: "2026-11-05", endDate: "2026-11-05", session: "full_day" },
          { startDate: "2026-11-05", endDate: "2026-11-05", session: "session_1" },
        ),
      ).toBe(true);
    });
  });

  describe("Convex Leave Integration & Workflow Suite", () => {
    async function setupLeaveEnv() {
      const t = convexTest(schema, modules);
      let adminId: any;
      let memberId: any;
      let workspaceId: any;
      let empId: any;

      await t.run(async (ctx) => {
        adminId = await ctx.db.insert("users", {
          name: "Admin User",
          email: "admin@indiapay.test",
        });
        memberId = await ctx.db.insert("users", {
          name: "Member User",
          email: "member@indiapay.test",
        });
        workspaceId = await ctx.db.insert("workspaces", {
          name: "Test IndiaPay Corp",
          ownerId: adminId,
          createdAt: Date.now(),
        });
        await ctx.db.insert("members", {
          workspaceId,
          userId: adminId,
          role: "admin",
          createdAt: Date.now(),
        });
        await ctx.db.insert("members", {
          workspaceId,
          userId: memberId,
          role: "member",
          createdAt: Date.now(),
        });
        empId = await ctx.db.insert("employees", {
          workspaceId,
          userId: memberId,
          firstName: "Rahul",
          lastName: "Sharma",
          email: "member@indiapay.test",
          status: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      return { t, adminId, memberId, workspaceId, empId };
    }

    test("Overlapping leave request is rejected by submitMyLeave", async () => {
      const { t, memberId, workspaceId } = await setupLeaveEnv();

      // Submit first leave: Nov 10 to Nov 12
      await t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
        workspaceId,
        leaveType: "sick",
        startDate: "2026-11-10",
        endDate: "2026-11-12",
        reason: "Flu recovery",
      });

      // Attempting to submit overlapping leave: Nov 11 to Nov 14 should fail!
      await expect(
        t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
          workspaceId,
          leaveType: "unpaid",
          startDate: "2026-11-11",
          endDate: "2026-11-14",
          reason: "Personal extension",
        }),
      ).rejects.toThrow("Overlapping leave conflict");
    });

    test("Non-overlapping leave request is accepted", async () => {
      const { t, memberId, workspaceId } = await setupLeaveEnv();

      // First leave: Nov 10 to Nov 12
      const id1 = await t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
        workspaceId,
        leaveType: "unpaid",
        startDate: "2026-11-10",
        endDate: "2026-11-12",
        reason: "Personal",
      });
      expect(id1).toBeDefined();

      // Second non-overlapping leave: Nov 15 to Nov 16 should succeed!
      const id2 = await t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
        workspaceId,
        leaveType: "sick",
        startDate: "2026-11-15",
        endDate: "2026-11-16",
        reason: "Medical checkup",
      });
      expect(id2).toBeDefined();
    });

    test("Casual Leave and Earned Leave are blocked on submitMyLeave for employees", async () => {
      const { t, memberId, workspaceId } = await setupLeaveEnv();

      // Casual leave attempt
      await expect(
        t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
          workspaceId,
          leaveType: "casual",
          startDate: "2026-11-20",
          endDate: "2026-11-21",
          reason: "Personal work",
        }),
      ).rejects.toThrow('Leave type "casual" is not permitted');

      // Earned leave attempt
      await expect(
        t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
          workspaceId,
          leaveType: "earned",
          startDate: "2026-11-20",
          endDate: "2026-11-21",
          reason: "Annual vacation",
        }),
      ).rejects.toThrow('Leave type "earned" is not permitted');
    });

    test("Cancelled leave request does NOT block a new request on the same dates", async () => {
      const { t, memberId, workspaceId } = await setupLeaveEnv();

      // Submit leave: Dec 1 to Dec 2
      const id = await t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
        workspaceId,
        leaveType: "unpaid",
        startDate: "2026-12-01",
        endDate: "2026-12-02",
        reason: "Trip",
      });

      // Cancel the leave
      await t.withIdentity(as(memberId)).mutation(api.leaves.cancelMyLeave, {
        workspaceId,
        requestId: id,
      });

      // Re-apply for Dec 1 to Dec 2 should succeed now because prior request was cancelled!
      const newId = await t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
        workspaceId,
        leaveType: "sick",
        startDate: "2026-12-01",
        endDate: "2026-12-02",
        reason: "Actually sick",
      });
      expect(newId).toBeDefined();
    });

    test("Restricted Holiday quota enforces max 2 days per year", async () => {
      const { t, memberId, workspaceId } = await setupLeaveEnv();

      // Apply 1st RH day: succeeds
      await t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
        workspaceId,
        leaveType: "restricted_holiday",
        startDate: "2026-02-17",
        endDate: "2026-02-17",
        reason: "Maha Shivratri",
      });

      // Apply 2nd RH day: succeeds
      await t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
        workspaceId,
        leaveType: "restricted_holiday",
        startDate: "2026-10-28",
        endDate: "2026-10-28",
        reason: "Karva Chauth",
      });

      // Apply 3rd RH day: should fail because quota is 2!
      await expect(
        t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
          workspaceId,
          leaveType: "restricted_holiday",
          startDate: "2026-11-09",
          endDate: "2026-11-09",
          reason: "Govardhan Puja",
        }),
      ).rejects.toThrow("Restricted Holiday quota exceeded");
    });

    test("Comp-Off workflow: requesting grant, admin review, and applying comp-off leave", async () => {
      const { t, adminId, memberId, workspaceId } = await setupLeaveEnv();

      // 1. Initially, comp-off balance is 0
      const initialBalances = await t
        .withIdentity(as(memberId))
        .query(api.leaves.getLeaveBalances, { workspaceId });
      expect(initialBalances.comp_off.balance).toBe(0);

      // 2. Member attempts to apply for comp-off leave with 0 balance -> rejected!
      await expect(
        t.withIdentity(as(memberId)).mutation(api.leaves.submitMyLeave, {
          workspaceId,
          leaveType: "comp_off",
          startDate: "2026-11-20",
          endDate: "2026-11-20",
          reason: "Need comp off",
        }),
      ).rejects.toThrow("Insufficient Comp-Off balance");

      // 3. Member submits a Comp-Off Grant request for working on Saturday
      const grantRequestId = await t
        .withIdentity(as(memberId))
        .mutation(api.leaves.submitCompOffRequest, {
          workspaceId,
          workDate: "2026-11-14",
          daysCount: 1,
          reason: "Worked weekend production release",
        });
      expect(grantRequestId).toBeDefined();

      // 4. Admin approves the comp-off grant
      await t
        .withIdentity(as(adminId))
        .mutation(api.leaves.reviewCompOffRequest, {
          workspaceId,
          requestId: grantRequestId,
          status: "approved",
          reviewRemarks: "Approved by manager",
        });

      // 5. Member now has 1 comp-off balance!
      const updatedBalances = await t
        .withIdentity(as(memberId))
        .query(api.leaves.getLeaveBalances, { workspaceId });
      expect(updatedBalances.comp_off.granted).toBe(1);
      expect(updatedBalances.comp_off.balance).toBe(1);

      // 6. Member can now successfully apply for comp-off leave!
      const compOffLeaveId = await t
        .withIdentity(as(memberId))
        .mutation(api.leaves.submitMyLeave, {
          workspaceId,
          leaveType: "comp_off",
          startDate: "2026-11-20",
          endDate: "2026-11-20",
          reason: "Availing weekend comp-off",
        });
      expect(compOffLeaveId).toBeDefined();
    });
  });
});
