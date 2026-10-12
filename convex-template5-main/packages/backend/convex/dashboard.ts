import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { readCounters } from "./counters";
import { requireMember } from "./orgs";

/** Workspace overview for the dashboard home — O(1) via maintained counters. */
export const stats = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
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
      .withIndex("by_workspace_status", (q) => q.eq("workspaceId", workspaceId).eq("status", "active"))
      .collect();

    // Latest finalized payroll run or latest run
    const runs = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .collect();

    const latestFinalized = runs.find((r) => r.status === "processed");
    const pendingRuns = runs.filter((r) => r.status === "pending_approval").length;

    // Pending leaves
    const pendingLeaves = await ctx.db
      .query("leaveRequests")
      .withIndex("by_workspace_status", (q) => q.eq("workspaceId", workspaceId).eq("status", "pending"))
      .collect();

    return {
      jobs: c.jobs ?? 0,
      openJobs: c.openJobs ?? 0,
      members: c.members ?? 0,
      files: c.files ?? 0,
      usageTotal,
      activeEmployeesCount: activeEmployees.length,
      latestGrossPayroll: latestFinalized?.totalGrossSalary ?? 0,
      latestNetPayroll: latestFinalized?.totalNetSalary ?? 0,
      pendingApprovalsCount: pendingRuns + pendingLeaves.length,
      latestPeriod: latestFinalized?.periodMonth ?? null,
    };
  },
});
