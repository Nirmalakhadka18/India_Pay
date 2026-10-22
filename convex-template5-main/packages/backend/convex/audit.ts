import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { audit } from "./auditLog";
import { requireDevSeed } from "./devGuard";
import { requireRole } from "./orgs";

export { audit } from "./auditLog";

/** Internal entry point (explicit userId) — for automation/testing. */
export const record = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    action: v.string(),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, a) => {
    requireDevSeed();
    await audit(ctx, a.workspaceId, a.userId, a.action, a.meta);
  },
});

/** Reactive: the current user's recent audit entries (for the dashboard).
 * RESTRICTED: Only Workspace Administrators can view company-wide audit trails.
 */
export const recent = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    await requireRole(ctx, userId, workspaceId, ["admin"]);
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(50);

    return await Promise.all(
      logs.map(async (log) => {
        const u = await ctx.db.get(log.userId);
        return {
          ...log,
          userName: u?.name ?? u?.email ?? "System User",
          userEmail: u?.email ?? "unknown@company.com",
        };
      }),
    );
  },
});
