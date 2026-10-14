import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { readCounters } from "./counters";
import { requireMember } from "./orgs";

/** Workspace overview for the dashboard home — O(1) via maintained counters. */
export const stats = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodMonth: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, periodMonth }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    await requireMember(ctx, userId, workspaceId);
    const c = await readCounters(ctx, workspaceId);
    // usage rows are few per workspace (one per metric) — a small scan is fine.
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_workspace_metric", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    const usageTotal = usage.reduce((n, u) => n + (u.count ?? 0), 0);

    // Active employees count
    const activeEmployees = await ctx.db
      .query("employees")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", "active"),
      )
      .collect();

    // Persisted payroll runs for workspace
    const runs = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .collect();

    // Qualifying runs are approved or processed (finalized) runs.
    // Exclude draft, calculated, pending_approval (submitted), and rejected runs.
    const qualifyingRuns = runs.filter(
      (r) => r.status === "approved" || r.status === "processed",
    );

    let selectedRun: (typeof runs)[0] | null = null;
    if (periodMonth) {
      // Find qualifying run for the requested period, prioritizing processed over approved
      const periodRuns = qualifyingRuns.filter((r) => r.periodMonth === periodMonth);
      selectedRun =
        periodRuns.find((r) => r.status === "processed") ??
        periodRuns.find((r) => r.status === "approved") ??
        null;
    } else {
      // Pick the latest qualifying period
      if (qualifyingRuns.length > 0) {
        qualifyingRuns.sort((a, b) => {
          const pComp = b.periodMonth.localeCompare(a.periodMonth);
          if (pComp !== 0) return pComp;
          if (a.status === "processed" && b.status !== "processed") return -1;
          if (b.status === "processed" && a.status !== "processed") return 1;
          return b.createdAt - a.createdAt;
        });
        selectedRun = qualifyingRuns[0] ?? null;
      }
    }

    const pendingRuns = runs.filter((r) => r.status === "pending_approval").length;

    // Pending leaves
    const pendingLeaves = await ctx.db
      .query("leaveRequests")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", "pending"),
      )
      .collect();

    return {
      jobs: c.jobs ?? 0,
      openJobs: c.openJobs ?? 0,
      members: c.members ?? 0,
      files: c.files ?? 0,
      usageTotal,
      activeEmployeesCount: activeEmployees.length,
      latestGrossPayroll: selectedRun ? selectedRun.totalGrossSalary : null,
      latestNetPayroll: selectedRun ? selectedRun.totalNetSalary : null,
      latestPeriod: selectedRun ? selectedRun.periodMonth : null,
      latestPayrollStatus: selectedRun ? selectedRun.status : null,
      pendingApprovalsCount: pendingRuns + pendingLeaves.length,
    };
  },
});
